const config = require('./config'); // eslint-disable-line import/no-unresolved
const Discord = require('discord.js');
const moment = require('moment');
const util = require('util');
const mongo = require('./mongo_fs');

const MILLISECONDS_PER_MINUTE = 60 * 1000;

const client = new Discord.Client({ disabledEvents: ['TYPING_START'] });

let lastAudioCommand = null;

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

const chipCount = function chipCount(target)
{
    const startDate = moment(target.coldTurkeyDate, target.coldTurkeyDateFormat);
    const today = moment();

    let name = '';

    Object.keys(config.units).some((unit) =>
    {
        const diff = today.diff(startDate, unit);

        if (diff <= config.units[unit].max)
        {
            name = `${diff}-${unit.slice(0, -1)} chip`;
            return true;
        }

        return false;
    });

    return name;
};

const getEmoji = function getEmoji(name)
{
    const emoji = client.emojis.find('name', name);

    return emoji || '😀';
};

const playAudioRaw = function playAudioRaw(channel, file)
{
    if (playingAudio)
    {
        return;
    }

    channel.join().then((connection) =>
    {
        log(`Joined voice channel "${channel.name}".`);
        log(`Playing audio: ${file}...`);

        const player = connection.playFile(file);

        player.on('error', (err) =>
        {
            log('playAudio error!');
            log(util.inspect(err, false, null));
        });

        player.on('end', () =>
        {
            log('Audio finished.');
            log('Leaving voice channel.');
            connection.disconnect();
        });
    });
};


const playAudioFromMongo = function playAudioFromMongo(channel, fileId)
{
    if (playingAudio)
    {
        log(`Already playing, queueing audio for ${channel.name}`);
        queuedAudio = [channel, fileId];
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

            const player = connection.playStream(file);

            player.on('error', (err) =>
            {
                connection.disconnect();
                log('Error in playAudio!');
                log(util.inspect(err, false, null));
            });

            player.on('end', () =>
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

client.on('message', (message) =>
{
    const author = message.member;

    if (message.content.startsWith(config.commandPrefix))
    {
        const command = message.content.slice(config.commandPrefix.length).toLowerCase();
        const channel = author.voiceChannel;

        if (!channel)
        {
            return;
        }
        const validCommand = audioCommands.find(c => c.command === command);

        if (validCommand !== undefined)
        {
            if (playingAudio)
            {
                return;
            }
            const now = (new Date()).getTime();

            if (lastAudioCommand && now - lastAudioCommand <= MILLISECONDS_PER_MINUTE)
            {
                message.react('👎');
                return;
            }

            lastAudioCommand = now;

            const emoji = getEmoji(validCommand.emoji);
            message.react(emoji);

            playAudioRaw(channel, validCommand.path);
        }
        else if (author.id === message.guild.owner.id ||
            author.id === config.owner)
        {
            const target = config.targets.find('command', command);

            if (target && target.id && target.commandReaction)
            {
                const emoji = getEmoji(target.commandReaction);

                message.react(emoji);
                playWelcomeClip(message.guild.id, target.id, channel);
            }
        }
    }
});

// when Chris logs on, update his nickname
client.on('presenceUpdate', (oldMember, newMember) =>
{
    log(`User presence change: ${newMember.user.username} (${newMember.id}), ${oldMember.presence.status} => ${newMember.presence.status}`);

    if (oldMember.presence.status === 'offline' &&
        newMember.presence.status === 'online')
    {
        const target = config.targets.get(newMember.id);

        if (target &&
            target.coldTurkeyDate &&
            target.coldTurkeyDateFormat)
        {
            log('Target logged on!');

            const newNickname = chipCount(target);

            if (oldMember.nickname !== newNickname)
            {
                log('Changing nickname.');
                newMember.setNickname(newNickname);
            }
        }
    }
});

// when Chris joins voice chat, welcome him
client.on('voiceStateUpdate', (oldMember, newMember) =>
{
    if (newMember.id === client.user.id)
    {
        return;
    }

    const newChannel = newMember.voiceChannel;

    if (oldMember.voiceChannel !== newChannel &&
        newChannel !== undefined)
    {
        log(`${newMember.user.username} (${newMember.id}) joined` +
            ` voice channel "${newMember.voiceChannel.name}"`);

        playWelcomeClip(newChannel.guild.id, newMember.id, newChannel);
    }
});

client.on('ready', () =>
{
    log('Connected!');

    client.user.setPresence({ status: 'idle', game: { name: 'watersports' } });
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

        client.destroy().then(() =>
        {
            process.exit();
        });
    });
});

// Let's do it!
client.login(config.token);
