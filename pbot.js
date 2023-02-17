const config = require('./config'); // eslint-disable-line import/no-unresolved
const Discord = require('discord.js');
const moment = require('moment');
const util = require('util');
const Commands = require('./commands');
const mongo = require('./mongo_fs');

const MILLISECONDS_PER_MINUTE = 60 * 1000;

Commands.deployCommands();

const client = new Discord.Client({
    disabledEvents: ['TYPING_START'],
    intents: [Discord.GatewayIntentBits.GuildVoiceStates],
    partials: [Discord.Partials.GuildMember]
});

// Set up commands
client.commands = new Discord.Collection();
client.commandTimes = new Discord.Collection();
Commands.loadCommands(client);

let lastSimpsCommand = null;

let playingAudio = false;
let queuedAudio = [];

const audioCommands = [
    { command: 'activate', path: 'assets/activate.mp3', emoji: 'mello' },
    { command: 'pookie', path: 'assets/pookie.mp3', emoji: 'fartnite' },
    { command: 'revolution', path: 'assets/revolution.mp3', emoji: 'falgsc' },
];

const log = function log(message)
{
    const timestamp = moment();

    console.log(`${timestamp} ${message}`);
};

const now = function now()
{
    return (new Date()).getTime();
};

const getEmoji = function getEmoji(name)
{
    const emoji = client.emojis.cache.find(candidate => candidate.name === name);

    return emoji || '😀';
};


const playAudioFromMongo = function playAudioFromMongo(channel, fileId)
{
    if (playingAudio)
    {
        log('Already playing audio, ignoring (for now)');
        // TODO: re-enable this once the connection timeout thing is figured out
        // log(`Already playing, queueing audio for ${channel.name}`);
        // queuedAudio = [channel, fileId];
    }
    else
    {
        log(`Fetching file ${fileId}...`);
        const file = mongo.getSound(fileId);

        channel.join().then((connection) =>
        {
            playingAudio = true;
            log(`Joined voice channel "${channel.name}".`);
            log('Playing audio...');

            const player = connection.play(file);

            player.on('error', (err) =>
            {
                connection.disconnect();
                log('Error in playAudio!');
                log(util.inspect(err, false, null));
            });

            player.on('finish', () =>
            {
                playingAudio = false;

                log('Audio finished. Leaving voice channel.');
                connection.disconnect();

                if (queuedAudio.length === 2)
                {
                    log('Playing queued audio.');
                    playAudioFromMongo(queuedAudio[0], queuedAudio[1]);
                    queuedAudio = [];
                }
            });
        });
    }
};

const playWelcomeClip = function playWelcomeClip(guildId, targetId, channel)
{
    log(`Fetching intro sound list for user ${targetId} in guild ${guildId}...`);
    mongo.getSoundList(guildId, targetId).then((sounds) =>
    {
        log(`Found ${sounds.length}.`);

        if (sounds.length > 0)
        {
            const randIndex = Math.floor(Math.random() * sounds.length);
            const sound = sounds[randIndex];

            playAudioFromMongo(channel, sound.file_id);
        }
    });
};

// Handle slash commands
client.on(Discord.Events.InteractionCreate, async (interaction) =>
{
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (command)
    {
        const commandUsedAt = interaction.client.commandTimes.get(interaction.commandName);

        // If the command hasn't been used, doesn't have a cooldown, or the cooldown has passed
        if (!commandUsedAt
            || !command.cooldown
            || now() >= (commandUsedAt + command.cooldown))
        {
            try
            {
                // Only apply the cooldown if the command ran successfully
                if (await command.handler(interaction))
                {
                    interaction.client.commandTimes.set(interaction.commandName, now());
                }
            }
            catch (error)
            {
                interaction.reply({
                    content: 'I ran into a problem. It\'s your fault.',
                    ephemeral: true,
                });
            }
        }
        else // The command is on cooldown
        {
            const remainingCooldown =
                Math.ceil(((commandUsedAt + command.cooldown) - now()) / 1000);

            log(`Command /${interaction.commandName} is on cooldown until ${commandUsedAt + command.cooldown} (${remainingCooldown} seconds from now)`);

            interaction.reply({
                content: `Chill out! (You can use this command again in ${remainingCooldown} seconds)`,
                ephemeral: true
            });
        }
    }
    else
    {
        log(`Error: no command matching ${interaction.commandName}`);
    }
});

// client.on('message', (message) =>
// {
//     const author = message.member;

//     if (message.content.startsWith(config.commandPrefix))
//     {
//         const command = message.content.slice(config.commandPrefix.length).toLowerCase();
//         console.log(`Got command string '!${command}' from user ${author.id}`);

//         if (command === 'simps' || command === 'simpgang')
//         {
//             if (lastSimpsCommand && now() - lastSimpsCommand <= MILLISECONDS_PER_MINUTE * 10)
//             {
//                 message.react('👎');
//                 message.react('🔟');
//                 return;
//             }

//             lastSimpsCommand = now();

//             const emoji = getEmoji('games');
//             message.channel.send(`@here ${emoji}`);
//         }
//         else
//         {
//             message.react('❓');
//         }
//     }
// });

// when someone joins voice chat, welcome them
client.on('voiceStateUpdate', (oldState, newState) =>
{
    const newMember = newState.member;
    const newChannel = newState.channel;

    if (newMember.id === client.user.id)
    {
        return;
    }

    if (newChannel && oldState.channel !== newChannel)
    {
        log(`${newMember.user.username} (${newMember.id}) joined` +
            ` voice channel "${newChannel.name}"`);

        playWelcomeClip(newState.guild.id, newMember.id, newChannel);
    }
});

client.on('ready', () =>
{
    log('Connected!');

    client.user.setPresence({ status: 'idle', activity: { type: 'WATCHING', name: '👀' } });
});

client.on('error', (err) =>
{
    log('Websocket error!');
    log(util.inspect(err, false, null));
});

['SIGINT', 'SIGTERM'].forEach((signal) =>
{
    process.on(signal, () =>
    {
        log('Caught Ctrl-C; bye.');

        client.destroy();
        process.exit();
    });
});

// Let's do it!
client.login(config.token);
