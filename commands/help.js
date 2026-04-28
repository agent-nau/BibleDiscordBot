import { SlashCommandBuilder } from "discord.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Provides information about available commands.')
    .addStringOption(option =>
      option.setName('command')
        .setDescription('The specific command to get help for')
        .setRequired(false)
    ),
    async execute(interaction) {
        const commandFiles = fs.readdirSync(path.join(__dirname)).filter(file => file.endsWith('.js'));
        const commands = commandFiles.map(file => file.slice(0, -3));
        const command = interaction.options.getString('command');
        if (command) {
            if (commands.includes(command)) {
                const cmdModule = await import(`./${command}.js`);
                const specificHelp = `**${command}**: ${cmdModule.default.data.description}`;
                await interaction.reply({ content: specificHelp, ephemeral: true });
            } else {
                await interaction.reply({ content: 'Unknown command. Use `/help` to see all available commands.', ephemeral: true });
            }
        } else {
            const helpMessage = `**Available Commands:**\n${commands.map(cmd => `- \`/${cmd}\``).join('\n')}`;
            await interaction.reply({ content: helpMessage, ephemeral: true });
        }
    }
}