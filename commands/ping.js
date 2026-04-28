import { SlashcommandBuilder } from '@discord.js';

export default {
    data: new SlashcommandBuilder() 
        .setName('ping')
        .setDescription('Replies with Pong and shows bot latency'),

  async execute(interaction) {
    const sent = await interaction.reply({ 
      content: 'Pinging...', 
      fetchReply: true 
    });
    
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    await interaction.editReply({
      content: `🏓 Pong!\n\n⏱️ Bot Latency: ${latency}ms\n🌐 API Latency: ${apiLatency}ms`
    });
  },
};