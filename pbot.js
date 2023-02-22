const Discord = require('discord.js');
const {
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    getVoiceConnection,
    NoSubscriberBehavior,
    VoiceConnectionStatus
} = require('@discordjs/voice');
const util = require('util');

const { token } = require('./config'); // eslint-disable-line import/no-unresolved
const log = require('./log');
const Commands = require('./commands');
const mongo = require('./mongo_fs');

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

const now = function now()
{
    return (new Date()).getTime();
};

const playAudioFromMongo = async function playAudioFromMongo(guildId, channelId, fileId)
{
    // Discord only lets us be in one voice channel per guild, so handle that gracefully
    const existingConnection = getVoiceConnection(guildId);
    if (existingConnection) return;

    let connection;

    const guild = await client.guilds.fetch(guildId);

    // Set up the audio player
    const player = createAudioPlayer({ behaviors: [NoSubscriberBehavior.Pause] });
    player.play(createAudioResource(mongo.getSound(fileId)));

    // If the player transitioned from Playing to Idle, it finished playing, so clean up
    player.on(AudioPlayerStatus.Idle, () =>
    {
        player.stop();
        connection.destroy();
        log('Voice connection cleaned up');
    });

    log(`Joining voice channel ${channelId} in guild ${guild.name}`);

    // Join the voice channel
    connection = joinVoiceChannel({
        guildId,
        channelId,
        adapterCreator: guild.voiceAdapterCreator,
        selfMute: false
    });

    // When we're connected to the voice channel, play the audio
    connection.on(VoiceConnectionStatus.Ready, () =>
    {
        log(`Voice connection ready, playing mongo file ${fileId}`);
        connection.subscribe(player);
        player.unpause();
    });

    // Clean up if an error occurs
    connection.on(VoiceConnectionStatus.Disconnected, () =>
    {
        log('Disconnected');
        player.stop();
        connection.destroy();
    });
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

            playAudioFromMongo(guildId, channel, sound.file_id);
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

// When someone joins voice chat, welcome them
client.on(Discord.Events.VoiceStateUpdate, (oldState, newState) =>
{
    const newMember = newState.member;
    const newChannelId = newState.channelId;

    if (newMember.id === client.user.id) return;

    if (newChannelId && oldState.channelId !== newChannelId)
    {
        log(`${newMember.user.username} (${newMember.id}) joined` +
            ` voice channel ${newChannelId}`);

        playWelcomeClip(newState.guild.id, newMember.id, newChannelId);
    }
});

client.on(Discord.Events.ClientReady, () =>
{
    log('Connected!');

    client.user.setPresence({ status: 'idle', activity: { type: 'WATCHING', name: '👀' } });
});

client.on(Discord.Events.Error, (err) =>
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
client.login(token);
