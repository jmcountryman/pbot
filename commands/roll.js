const { SlashCommandBuilder } = require('discord.js');

const getReaction = (number) =>
{
    switch (number)
    {
        case 69:
            return '😜';
        case 100:
            return '💯';
        default:
            return '';
    }
};

const data = new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Rolls a random number between 1 and 100 (inclusive)');

const handler = async (interaction) =>
{
    const author = interaction.member;
    const number = Math.floor(Math.random() * 100) + 1;
    const content = `${author.toString()} rolled ${number} ${getReaction(number)}`.trim();

    await interaction.reply({ content });
};

module.exports = { data, handler };
