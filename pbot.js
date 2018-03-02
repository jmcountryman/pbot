const config = require('./config');
const Discord = require('discord.js');
const moment = require('moment');

const client = new Discord.Client({disabledEvents: ['TYPING_START']});

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
}

client.on('ready', () =>
{
    console.log('Connected!');
});

client.on('presenceChange', (oldMember, newMember) =>
{
    // Chris logged on
    if (oldMember.id == config.chris.id &&
        newMember.id == config.chris.id &&
        oldMember.presence.status == 'offline' &&
        newMember.presence.status == 'online')
    {
        newMember.setNickname(chipCount());
    }
});

console.log(chipCount());

// client.login(config.token);
