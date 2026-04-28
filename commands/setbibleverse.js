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
            await channel.send(`${data.reference}\n\n${data.text}`);
        }
    } catch (error) {
        // Ignore errors in scheduled sends
    }
}

export default {
  data: new SlashCommandBuilder()
    .setName('setbibleverse')
    .setDescription('Sends a random Bible verse in the channel. Can specify a book, chapter, verse or default for random. (Sends depends on what time interval you set. the default is 4 hours.)')
    .addStringOption(option =>
      option.setName('book')
        .setDescription('The book of the Bible (e.g., Genesis, Psalms)')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('chapter')
        .setDescription('The chapter number (e.g., 1, 2, 3)')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('verse')
        .setDescription('The verse number (e.g., 1, 2, 3)')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('interval')
        .setDescription('Interval in hours to send verses automatically (0 to send once)')
        .setRequired(false)
    ),
    async execute(interaction) {
        if (interaction.user.id !== process.env.OWNER_ID) {
            await interaction.reply('Only the bot owner can use this command.');
            return;
        }

        const book = interaction.options.getString('book');
        const chapter = interaction.options.getInteger('chapter');
        const verse = interaction.options.getInteger('verse');
        const intervalHours = interaction.options.getInteger('interval') || 0;

        let url;
        if (book && chapter && verse) {
            url = `https://bible-api.com/${book}+${chapter}:${verse}`;
        } else if (book) {
            url = `https://bible-api.com/data/web/random/${book}`;
        } else {
            const testaments = ['OT', 'NT'];
            const randomTestament = testaments[Math.floor(Math.random() * testaments.length)];
            url = `https://bible-api.com/data/web/random/${randomTestament}`;
        }

        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.text) {
                await interaction.reply(`${data.reference}\n\n${data.text}`);
            } else {
                await interaction.reply('Verse not found.');
                return;
            }
        } catch (error) {
            await interaction.reply('Error fetching verse.');
            return;
        }

        // Handle scheduling
        const channelId = interaction.channel.id;
        const existing = scheduledVerses.get(channelId);
        if (existing) {
            clearInterval(existing.intervalId);
            scheduledVerses.delete(channelId);
        }

        if (intervalHours > 0) {
            const intervalMs = intervalHours * 60 * 60 * 1000;
            const intervalId = setInterval(() => sendRandomVerse(interaction.channel), intervalMs);
            scheduledVerses.set(channelId, { intervalId, channel: interaction.channel });
        }
    }
}
