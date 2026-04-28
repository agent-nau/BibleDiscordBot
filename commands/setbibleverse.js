import { SlashCommandBuilder } from "discord.js";

const scheduledVerses = new Map(); // channelId -> { intervalId, channel }

// Mapping of common book names to 3-letter IDs used by bible-api.com
const bookMapping = {
    'genesis': 'GEN', 'exodus': 'EXO', 'leviticus': 'LEV', 'numbers': 'NUM', 'deuteronomy': 'DEU',
    'joshua': 'JOS', 'judges': 'JDG', 'ruth': 'RUT', '1 samuel': '1SA', '2 samuel': '2SA',
    '1 kings': '1KI', '2 kings': '2KI', '1 chronicles': '1CH', '2 chronicles': '2CH',
    'ezra': 'EZR', 'nehemiah': 'NEH', 'esther': 'EST', 'job': 'JOB', 'psalms': 'PSA',
    'proverbs': 'PRO', 'ecclesiastes': 'ECC', 'song of solomon': 'SNG', 'isaiah': 'ISA',
    'jeremiah': 'JER', 'lamentations': 'LAM', 'ezekiel': 'EZK', 'daniel': 'DAN',
    'hosea': 'HOS', 'joel': 'JOL', 'amos': 'AMO', 'obadiah': 'OBA', 'jonah': 'JON',
    'micah': 'MIC', 'nahum': 'NAM', 'habakkuk': 'HAB', 'zephaniah': 'ZEP',
    'haggai': 'HAG', 'zechariah': 'ZEC', 'malachi': 'MAL',
    'matthew': 'MAT', 'mark': 'MRK', 'luke': 'LUK', 'john': 'JHN', 'acts': 'ACT',
    'romans': 'ROM', '1 corinthians': '1CO', '2 corinthians': '2CO', 'galatians': 'GAL',
    'ephesians': 'EPH', 'philippians': 'PHP', 'colossians': 'COL', '1 thessalonians': '1TH',
    '2 thessalonians': '2TH', '1 timothy': '1TI', '2 timothy': '2TI', 'titus': 'TIT',
    'philemon': 'PHM', 'hebrews': 'HEB', 'james': 'JAS', '1 peter': '1PE', '2 peter': '2PE',
    '1 john': '1JN', '2 john': '2JN', '3 john': '3JN', 'jude': 'JUD', 'revelation': 'REV'
};

function getBookId(bookName) {
    if (!bookName) return null;
    const normalized = bookName.toLowerCase().trim();
    // Check if it's already a 3-letter ID
    if (Object.values(bookMapping).includes(normalized.toUpperCase())) {
        return normalized.toUpperCase();
    }
    return bookMapping[normalized] || null;
}

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
        .setDescription('Set or send a random Bible verse with an optional interval.')
        .addStringOption(option =>
            option.setName('book')
                .setDescription('The book of the Bible (e.g., Genesis, Psalms)')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('chapter')
                .setDescription('The chapter number')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('verse')
                .setDescription('The verse number')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('interval')
                .setDescription('Interval in hours to send verses automatically (0 to stop)')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(168) // Max 1 week
        ),

    async execute(interaction) {
        // Owner check
        if (interaction.user.id !== process.env.OWNER_ID) {
            return await interaction.reply({ 
                content: '❌ Only the bot owner can use this command.', 
                ephemeral: true 
            });
        }

        const bookName = interaction.options.getString('book');
        const chapter = interaction.options.getInteger('chapter');
        const verse = interaction.options.getInteger('verse');
        const intervalHours = interaction.options.getInteger('interval');

        let url;
        let isSpecific = false;

        if (bookName && chapter && verse) {
            // Specific verse: john 3:16
            url = `https://bible-api.com/${encodeURIComponent(bookName)}+${chapter}:${verse}`;
            isSpecific = true;
        } else if (bookName) {
            // Random verse from specific book
            const bookId = getBookId(bookName);
            if (bookId) {
                url = `https://bible-api.com/data/web/random/${bookId}`;
            } else {
                // Fallback to searching by book name if ID not found
                url = `https://bible-api.com/${encodeURIComponent(bookName)}`;
            }
        } else {
            // Completely random
            const testaments = ['OT', 'NT'];
            const randomTestament = testaments[Math.floor(Math.random() * testaments.length)];
            url = `https://bible-api.com/data/web/random/${randomTestament}`;
        }

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
                
                if (existing) {
                    clearInterval(existing.intervalId);
                    scheduledVerses.delete(channelId);
                }

                if (intervalHours !== null) {
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
                await interaction.editReply('❌ Verse not found. Please check the book name and numbers.');
            }
        } catch (error) {
            console.error('Error in setbibleverse:', error);
            await interaction.editReply('❌ There was an error fetching the Bible verse. Please try again later.');
        }
    }
};
