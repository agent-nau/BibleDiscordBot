import { SlashCommandBuilder } from "discord.js";

const scheduledVerses = new Map(); // channelId -> { intervalId, channel }

async function sendRandomVerse(channel) {
    const testaments = ['OT', 'NT'];
    const randomTestament = testaments[Math.floor(Math.random() * testaments.length)];
    const url = `https://bible-api.com/data/web/random/${randomTestament}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.text) {
            await channel.send(`📖 **${data.reference}**\n\n${data.text}`);
        }
    } catch (error) {
        console.error('Error sending scheduled verse:', error);
    }
}

export default {
    data: new SlashCommandBuilder()
        .setName('setbibleverse')
        .setDescription('Get a random Bible verse or set an interval for automatic verses.')
        .addIntegerOption(option =>
            option.setName('interval')
                .setDescription('Interval in hours to send verses automatically (0 to stop)')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(168) // Max 1 week
        ),

    async execute(interaction) {
        const intervalHours = interaction.options.getInteger('interval');

        // Owner check ONLY for scheduling
        if (intervalHours !== null && interaction.user.id !== process.env.OWNER_ID) {
            return await interaction.reply({ 
                content: '❌ Only the bot owner can set or stop automatic verse intervals.', 
                ephemeral: true 
            });
        }

        // URL for a completely random verse
        const testaments = ['OT', 'NT'];
        const randomTestament = testaments[Math.floor(Math.random() * testaments.length)];
        const url = `https://bible-api.com/data/web/random/${randomTestament}`;

        await interaction.deferReply();

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('API request failed');
            
            const data = await response.json();
            
            if (data.text) {
                let responseText = `📖 **${data.reference}**\n\n${data.text}`;
                
                // Handle scheduling
                const channelId = interaction.channel.id;
                const existing = scheduledVerses.get(channelId);
                
                if (intervalHours !== null) {
                    if (existing) {
                        clearInterval(existing.intervalId);
                        scheduledVerses.delete(channelId);
                    }

                    if (intervalHours > 0) {
                        const intervalMs = intervalHours * 60 * 60 * 1000;
                        const intervalId = setInterval(() => sendRandomVerse(interaction.channel), intervalMs);
                        scheduledVerses.set(channelId, { intervalId, channel: interaction.channel });
                        responseText += `\n\n✅ **Scheduled!** A random verse will be sent every ${intervalHours} hour(s) in this channel.`;
                    } else if (intervalHours === 0 && existing) {
                        responseText += `\n\n🛑 **Stopped!** Automatic verses have been disabled for this channel.`;
                    }
                }

                await interaction.editReply(responseText);
            } else {
                await interaction.editReply('❌ Failed to fetch a random verse. Please try again later.');
            }
        } catch (error) {
            console.error('Error in setbibleverse:', error);
            await interaction.editReply('❌ There was an error fetching the Bible verse. Please try again later.');
        }
    }
};
