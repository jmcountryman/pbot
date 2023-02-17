const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('../config');

const forEachCommand = (callback) =>
{
    const commandFiles = fs.readdirSync(__dirname).filter(file =>
        file.endsWith('.js') && !file.startsWith('index.'));

    commandFiles.forEach((file) =>
    {
        const filePath = path.join(__dirname, file);
        const command = require(filePath); // eslint-disable-line

        if ('data' in command && 'handler' in command)
        {
            callback(command);
        }
        else
        {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "handler" property.`);
        }
    });
};

// Tell Discord about our commands
const deployCommands = () =>
{
    const allCommands = [];

    forEachCommand((command) =>
    {
        allCommands.push(command.data.toJSON());
    });

    const route = guildId
        ? Routes.applicationGuildCommands(clientId, guildId)
        : Routes.applicationCommands(clientId);

    const rest = new REST({ version: '10' }).setToken(token);

    return new Promise((resolve, reject) =>
    {
        rest.put(route, { body: allCommands }).then(() =>
        {
            console.log(`Successfully deployed ${allCommands.length} commands`);
            resolve();
        }).catch((error) =>
        {
            console.log('Error while deploying commands:', error);
            reject();
        });
    });
};

// Set up the handlers for our commands on the client object
const loadCommands = (client) =>
{
    forEachCommand((command) =>
    {
        client.commands.set(command.data.name, command);
    });
};

module.exports = { deployCommands, loadCommands };
