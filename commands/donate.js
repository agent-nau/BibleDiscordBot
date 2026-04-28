import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('donate')
        .setDescription('Provides information on how to support the bot.'),
    async execute(interaction) {
        const donateMessage = `🙏 If you'd like to support the bot, you can donate via [Patreon](https://donate.vecscorporation.shop). Your support helps with hosting costs and future development! Thank you! 🙏`;
        await interaction.reply({ content: donateMessage, ephemeral: true });
    }
}