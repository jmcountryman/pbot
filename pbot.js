const config = require('./config');
const Discord = require('discord.js');
const moment = require('moment');
const path = require('path');

const client = new Discord.Client({disabledEvents: ['TYPING_START']});
const welcomeClips = {
    chris: path.resolve(config.chris.welcomeClip),
    mitch: path.resolve(config.mitch.welcomeClip),
};

const log = function(message)
{
    const timestamp = moment();

    console.log(`${timestamp} ${message}`);
};

const chipCount = function()
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
    });

    return name;
};

const isChris = function(user)
{
    return (user.id == config.chris.id);
};

const isMitch = function(user)
{
    return (user.id == config.mitch.id);
};

const playAudio = function(channel, file)
{
    channel.join().then((connection) =>
    {
        log(`Joined voice channel "${channel.name}".`);
        log(`Playing audio: ${file}...`);

        const player = connection.playFile(file);
        player.on('end', () =>
        {
            log('Audio finished.');
            log('Leaving voice channel.')
            connection.disconnect();
        });
    });
}

client.on('ready', () =>
{
    log('Connected!');
    log('Waiting for Chris...');
});

client.on('message', (message) =>
{
    const author = message.member;

    if(author.id == message.guild.owner.id)
    {
        if(message.content.startsWith(config.commandPrefix))
        {
            // TODO: load these dynamically from files
            const command = message.content.slice(config.commandPrefix.length).toLowerCase();
            const channel = author.voiceChannel;

            switch(command)
            {
                case 'baby':
                    if(channel)
                    {
                        message.react('👶');
                        playAudio(channel, config.mitch.welcomeClip);
                    }
                    break;

                case 'chris':
                    if(channel)
                    {
                        message.react('🔌');
                        playAudio(channel, config.chris.welcomeClip);
                    }
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
        oldMember.presence.status == 'offline' &&
        newMember.presence.status == 'online')
    {
        log('Chris logged on!');
        const newNickname = chipCount();
        if(newMember.nickname !== newNickname)
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
});

// Let's do it!
client.login(config.token);
