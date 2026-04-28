import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";

const scheduledVerses = new Map(); // channelId -> { intervalId, channel }

/**
 * Fetches a random verse from the Bible API.
 */
async function fetchRandomVerse() {
    const url = `https://bible-api.com/data/web/random`;

    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        
        const data = await response.json();
        if (data.random_verse && data.random_verse.text) {
            return {
                reference: `${data.random_verse.book} ${data.random_verse.chapter}:${data.random_verse.verse}`,
                text: data.random_verse.text.trim(),
                translation: data.translation.name
            };
        }
    } catch (error) {
        console.error('Error fetching random verse:', error);
    }
    return null;
}

/**
 * Creates a premium-looking Bible verse embed.
 */
function createVerseEmbed(verse) {
    return new EmbedBuilder()
        .setColor(0xFFA500) // Golden Orange
        .setTitle(`📖 ${verse.reference}`)
        .setDescription(`*"${verse.text}"*`)
        .setFooter({ text: `Translation: ${verse.translation} • Daily Inspiration` })
        .setTimestamp();
}

/**
 * Sends a random verse to a channel (used for scheduling).
 */
async function sendScheduledVerse(channel) {
    const verse = await fetchRandomVerse();
    if (verse) {
        const embed = createVerseEmbed(verse);
        try {
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(`Failed to send scheduled verse to channel ${channel.id}:`, error);
        }
    }
}

export default {
    data: new SlashCommandBuilder()
        .setName('setbibleverse')
        .setDescription('Get a random Bible verse or set an interval for automatic verses.')
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2])
        .addIntegerOption(option =>
            option.setName('interval')
                .setDescription('Interval in hours to send verses automatically (0 to stop)')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(168) // Max 1 week
        ),

    async execute(interaction) {
        // Defer reply IMMEDIATELY to prevent "Unknown interaction" (timeout)
        // Using flags instead of ephemeral to fix deprecation warning
        try {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        } catch (error) {
            console.error('Error deferring reply:', error);
            return; // Interaction likely timed out
        }

        const intervalHours = interaction.options.getInteger('interval');

        // Owner check ONLY for scheduling
        if (intervalHours !== null && interaction.user.id !== process.env.OWNER_ID) {
            return await interaction.editReply({ 
                content: '❌ Only the bot owner can set or stop automatic verse intervals.'
            });
        }

        try {
            const verse = await fetchRandomVerse();
            
            if (verse) {
                const embed = createVerseEmbed(verse);
                
                // Send the embed publicly to the channel
                await interaction.channel.send({ embeds: [embed] });

                let statusText = '✅ Sent!';
                
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
                        const intervalId = setInterval(() => sendScheduledVerse(interaction.channel), intervalMs);
                        scheduledVerses.set(channelId, { intervalId, channel: interaction.channel });
                        statusText = `✅ **Sent and Scheduled!** A random verse will be sent every ${intervalHours} hour(s) in this channel.`;
                    } else if (intervalHours === 0 && existing) {
                        statusText = `✅ **Sent!** Automatic verses have been disabled for this channel.`;
                    }
                }

                // Edit the ephemeral reply to show completion status
                await interaction.editReply({ content: statusText });
            } else {
                await interaction.editReply({ content: '❌ Failed to fetch a random verse. Please try again later.' });
            }
        } catch (error) {
            console.error('Error in setbibleverse command:', error);
            // Check if we can still reply
            try {
                await interaction.editReply({ content: '❌ There was an error processing the Bible verse. Please try again later.' });
            } catch (replyError) {
                console.error('Failed to send error reply:', replyError);
            }
        }
    }
};
