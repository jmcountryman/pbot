const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Rolls a random number between 1 and 100 (inclusive)');

const handler = async (interaction) =>
{
    const author = interaction.member;
    const number = Math.ceil(Math.random() * 100);
    const content = `${author.toString()} rolled ${number}`;

    const sentMessage = await interaction.reply({ content, fetchReply: true });

    if (number === 69)
    {
        sentMessage.react('😜');
    }
    else if (number === 100)
    {
        sentMessage.react('💯');
    }
};

module.exports = { data, handler };
