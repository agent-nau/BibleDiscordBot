import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder() 
        .setName('ping')
        .setDescription('Replies with Pong and shows bot latency'),

  async execute(interaction) {
    const response = await interaction.reply({ 
      content: 'Pinging...', 
      withResponse: true 
    });
    
    const sent = await response.fetch();
    
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    await interaction.editReply({
      content: `🏓 Pong!\n\n⏱️ Bot Latency: ${latency}ms\n🌐 API Latency: ${apiLatency}ms`
    });
  },
};