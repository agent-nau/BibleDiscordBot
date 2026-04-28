import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Provides information about available commands.')
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2])
    .addStringOption(option =>
      option.setName('command')
        .setDescription('The specific command to get help for')
        .setRequired(false)
    ),
    async execute(interaction) {
        const commandFiles = fs.readdirSync(path.join(__dirname)).filter(file => file.endsWith('.js'));
        const commands = commandFiles.map(file => file.slice(0, -3));
        const commandName = interaction.options.getString('command');

        const embed = new EmbedBuilder()
            .setColor(0x3498DB) // Soft Blue
            .setTimestamp()
            .setFooter({ text: 'Bible Bot • Help System' });

        if (commandName) {
            if (commands.includes(commandName)) {
                try {
                    const cmdModule = await import(`./${commandName}.js`);
                    const cmd = cmdModule.default || cmdModule;
                    
                    embed.setTitle(`📖 Command: /${commandName}`)
                         .setDescription(cmd.data.description || 'No description available.');
                    
                    await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
                } catch (error) {
                    console.error(`Error loading help for ${commandName}:`, error);
                    await interaction.reply({ content: '❌ Error loading command details.', flags: [MessageFlags.Ephemeral] });
                }
            } else {
                await interaction.reply({ content: '❌ Unknown command. Use `/help` to see all available commands.', flags: [MessageFlags.Ephemeral] });
            }
        } else {
            embed.setTitle('🤖 Available Commands')
                 .setDescription('Here is a list of all commands you can use with the Bible Bot:')
                 .addFields(
                     { name: '✨ Commands List', value: commands.map(cmd => `\`/${cmd}\``).join(', ') }
                 )
                 .addFields(
                     { name: '💡 Tip', value: 'Use `/help <command>` for more details on a specific command.' }
                 );

            await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        }
    }
}