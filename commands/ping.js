import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';

export default {
    data: new SlashCommandBuilder() 
        .setName('ping')
        .setDescription('Replies with Pong and shows bot latency')
        .setIntegrationTypes([0, 1]) // Guild and User
        .setContexts([0, 1, 2]), // Guild, Bot DM, Private Channel

  async execute(interaction) {
    const response = await interaction.reply({ 
      content: 'Pinging...', 
      flags: [MessageFlags.Ephemeral],
      withResponse: true 
    });
    
    const sent = await response.fetch();
    
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    const embed = new EmbedBuilder()
        .setColor(0x00AE86) // Teal
        .setTitle('🏓 Pong!')
        .addFields(
            { name: '⏱️ Bot Latency', value: `\`${latency}ms\``, inline: true },
            { name: '🌐 API Latency', value: `\`${apiLatency}ms\``, inline: true }
        )
        .setFooter({ text: 'Bible Bot • Performance' })
        .setTimestamp();

    await interaction.editReply({
      content: null,
      embeds: [embed]
    });
  },
};