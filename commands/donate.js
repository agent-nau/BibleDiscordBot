import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('donate')
        .setDescription('Provides information on how to support the bot.'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0xFFD700) // Gold
            .setTitle('🙏 Support Our Mission')
            .setDescription('Your support helps us keep the bot running and bring the Word of God to more people! Hosting costs and development are supported by kind users like you.')
            .addFields(
                { name: '💖 Patreon', value: '[Click here to support us!](https://donate.vecscorporation.shop)', inline: true }
            )
            .setFooter({ text: 'Thank you for your generosity! • Bible Bot' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}