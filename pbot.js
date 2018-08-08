const config = require('./config'); // eslint-disable-line import/no-unresolved
const Discord = require('discord.js');
const moment = require('moment');

const util = require('util');

const client = new Discord.Client({disabledEvents: ['TYPING_START']});

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

const playAudio = function playAudio(channel, file)
{
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

const playWelcomeClip = function playWelcomeClip(target, channel)
{
    if (typeof target.welcomeClip === 'string')
    {
        playAudio(channel, target.welcomeClip);
    }
    else if (typeof target.welcomeClip === 'object' && target.welcomeClip.length > 0)
    {
        const randomIndex = Math.floor(Math.random() * target.welcomeClip.length);

        playAudio(channel, target.welcomeClip[randomIndex]);
    }
};

client.on('message', (message) =>
{
    const author = message.member;

    if (author.id === message.guild.owner.id ||
        author.id === config.owner)
    {
        if (message.content.startsWith(config.commandPrefix))
        {
            const command = message.content.slice(config.commandPrefix.length).toLowerCase();
            const channel = author.voiceChannel;

            const target = config.targets.find('command', command);

            if (channel &&
                target &&
                target.welcomeClip &&
                target.commandReaction)
            {
                const emoji = client.emojis.find('name', target.commandReaction);

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

    const target = config.targets.get(newMember.id);

    if (oldMember.voiceChannel !== newChannel &&
        newChannel !== undefined &&
        target &&
        target.welcomeClip)
    {
        log('Target joined a voice channel');

        playWelcomeClip(target, newChannel);
    }
});

client.on('ready', () =>
{
    log('Connected!');

    client.user.setPresence({status: 'idle', game: {name: 'watersports'}});
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
