const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const audioCommandHandler = require('./templates/audioCommand');

const data = new SlashCommandBuilder()
    .setName('revolution')
    .setDescription('Plays an audio clip from "Orange County" (2002) in your current voice channel');

const handler = audioCommandHandler(path.join(__dirname, '../assets/revolution.mp3'));

module.exports = {
    data,
    handler,
    cooldown: 60 * 1000
};
