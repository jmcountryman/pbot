const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const audioCommandHandler = require('./templates/audioCommand');

const data = new SlashCommandBuilder()
    .setName('pookie')
    .setDescription('Plays an audio clip from "Harold and Kumar Go to White Castle" (2004) in your current voice channel');

const handler = audioCommandHandler(path.join(__dirname, '../assets/pookie.mp3'));

module.exports = {
    data,
    handler,
    cooldown: 60 * 1000
};
