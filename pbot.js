const config = require('./config'); // eslint-disable-line import/no-unresolved
const Discord = require('discord.js');
const moment = require('moment');
const util = require('util');
const mongo = require('./mongo_fs');

const MILLISECONDS_PER_MINUTE = 60 * 1000;

const client = new Discord.Client({ disabledEvents: ['TYPING_START'] });

let lastActivate = null;

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

const playAudio = function playAudio(channel, file)
{
    channel.join().then((connection) =>
    {
        log(`Joined voice channel "${channel.name}".`);
        log('Playing audio...');

        const player = connection.playStream(file);

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

const playWelcomeClip = function playWelcomeClip(guildId, targetId, channel)
{
    mongo.getSoundList(guildId, targetId).then((sounds) =>
    {
        if (sounds.length > 0)
        {
            const randIndex = Math.floor(Math.random() * sounds.length);
            const sound = sounds[randIndex];

            log(`Fetching file ${sound.file_id}...`);

            // eslint-disable-next-line no-underscore-dangle
            const soundFile = mongo.getSound(sound.file_id);
            playAudio(channel, soundFile);
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

        if (command === 'activate')
        {
            const now = (new Date()).getTime();

            if (lastActivate && now - lastActivate <= MILLISECONDS_PER_MINUTE)
            {
                message.react('👎');
                return;
            }

            lastActivate = now;

            const emoji = getEmoji('mello');
            message.react(emoji);

            playAudio(channel, 'assets/activate.mp3');
        }
        else if (author.id === message.guild.owner.id ||
            author.id === config.owner)
        {
            const target = config.targets.find('command', command);

            if (target &&
                target.welcomeClip &&
                target.commandReaction)
            {
                const emoji = getEmoji(target.commandReaction);

                message.react(emoji);
                playWelcomeClip(target, channel);
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
    log(`Voice status change: ${newMember.user.username} (${newMember.id})`);

    const newChannel = newMember.voiceChannel;

    if (oldMember.voiceChannel !== newChannel &&
        newChannel !== undefined)
    {
        log('Target joined a voice channel');

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

process.on('SIGINT', () =>
{
    log('Caught Ctrl-C; bye.');

    client.destroy().then(() =>
    {
        process.exit();
    });
});

// Let's do it!
client.login(config.token);
