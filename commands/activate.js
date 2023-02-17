const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const audioCommandHandler = require('./templates/audioCommand');

const data = new SlashCommandBuilder()
    .setName('activate')
    .setDescription('Plays an excerpt of Chase\'s critically acclaimed song "Activate" in your current voice channel');

const handler = audioCommandHandler(path.join(__dirname, '../assets/activate.mp3'));

module.exports = {
    data,
    handler,
    cooldown: 60 * 1000
};
