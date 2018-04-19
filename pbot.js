const config = require('./config');
const Discord = require('discord.js');
const moment = require('moment');

const path = require('path');
const util = require('util');

const client = new Discord.Client({disabledEvents: ['TYPING_START']});
const welcomeClips = {
    chris: path.resolve(config.chris.welcomeClip),
    mitch: path.resolve(config.mitch.welcomeClip),
    chase: path.resolve(config.chase.welcomeClip),
};

const log = function log(message)
{
    const timestamp = moment();

    console.log(`${timestamp} ${message}`);
};

const chipCount = function chipCount()
{
    const startDate = moment(config.chris.coldTurkeyDate, config.chris.coldTurkeyDateFormat);
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

const isChris = function isChris(user)
{
    return (user.id === config.chris.id);
};

const isMitch = function isMitch(user)
{
    return (user.id === config.mitch.id);
};

const isChase = function isChase(user)
{
    return (user.id === config.chase.id);
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
            console.error(util.inspect(err, false, null));
        });

        player.on('end', () =>
        {
            log('Audio finished.');
            log('Leaving voice channel.');
            connection.disconnect();
        });
    });
};

client.on('ready', () =>
{
    log('Connected!');
    log('Waiting for Chris...');
});

client.on('error', (err) =>
{
    console.log('Websocket error!');
    console.error(util.inspect(err, false, null));
});

client.on('message', (message) =>
{
    const author = message.member;

    if (author.id === message.guild.owner.id ||
        author.id === config.owner)
    {
        if (message.content.startsWith(config.commandPrefix))
        {
            // TODO: load these dynamically from files
            const command = message.content.slice(config.commandPrefix.length).toLowerCase();
            const channel = author.voiceChannel;

            switch (command)
            {
                case 'baby':
                    if (channel)
                    {
                        const baby = client.emojis.find('name', 'baby');

                        message.react(baby);
                        playAudio(channel, welcomeClips.mitch);
                    }
                    break;

                case 'chris':
                    if (channel)
                    {
                        const nowow = client.emojis.find('name', 'nowow');

                        message.react(nowow);
                        playAudio(channel, welcomeClips.chris);
                    }
                    break;

                case 'mello':
                    if (channel)
                    {
                        const mello = client.emojis.find('name', 'mello');

                        message.react(mello);
                        playAudio(channel, welcomeClips.chase);
                    }
                    break;

                default:
                    break;
            }
        }
    }
});

// when Chris logs on, update his nickname
client.on('presenceUpdate', (oldMember, newMember) =>
{
    log(`User presence change: ${newMember.id} - ${newMember.nickname}, ${oldMember.presence.status} => ${newMember.presence.status}`);

    if (isChris(oldMember) &&
        isChris(newMember) &&
        oldMember.presence.status === 'offline' &&
        newMember.presence.status === 'online')
    {
        log('Chris logged on!');
        const newNickname = chipCount();
        if (newMember.nickname !== newNickname)
        {
            log('Changing nickname.');
            newMember.setNickname(chipCount());
        }
    }
});

// when Chris joins voice chat, welcome him
client.on('voiceStateUpdate', (oldMember, newMember) =>
{
    log(`Voice status change: ${newMember.id} - ${newMember.nickname}`);

    const newChannel = newMember.voiceChannel;

    // TODO: make this generic
    if (isChris(oldMember) &&
        isChris(newMember) &&
        oldMember.voiceChannel !== newChannel &&
        newChannel !== undefined)
    {
        log('Chris joined a voice channel!');

        playAudio(newChannel, welcomeClips.chris);
    }

    if (isMitch(oldMember) &&
        isMitch(newMember) &&
        oldMember.voiceChannel !== newChannel &&
        newChannel !== undefined)
    {
        log('Mitch joined a voice channel!');

        playAudio(newChannel, welcomeClips.mitch);
    }

    if (isChase(oldMember) &&
        isChase(newMember) &&
        oldMember.voiceChannel !== newChannel &&
        newChannel !== undefined)
    {
        log('Chase joined a voice channel!');

        playAudio(newChannel, welcomeClips.chase);
    }
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
