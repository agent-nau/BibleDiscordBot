import 'dotenv/config';
import { Client, GatewayIntentBits, Collection, REST, Routes, MessageFlags } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { keepAlive } from './keep-alive.js';

// Validate environment variables
const requiredEnv = ['DISCORD_TOKEN', 'CLIENT_ID'];
const missingEnv = requiredEnv.filter(env => !process.env[env]);

if (missingEnv.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnv.join(', ')}`);
  console.error('👉 Please set these in your Render Environment Variables dashboard.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

// Start keep-alive server IMMEDIATELY so Render can find the port
// Doing this before any 'await' calls to ensure the port is bound quickly
keepAlive(process.env.PORT || 3000, client);

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(filePath);
  const cmd = command.default || command;

  if ('data' in cmd && 'execute' in cmd) {
    client.commands.set(cmd.data.name, cmd);
    commands.push(cmd.data.toJSON());
    console.log(`✅ Loaded command: ${cmd.data.name}`);
  } else {
    console.log(`⚠️ Command at ${filePath} is missing required "data" or "execute" property.`);
  }
}

// Register slash commands
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

try {
  console.log('🔄 Started refreshing application (/) commands.');
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
  console.log('✅ Successfully reloaded application (/) commands.');
} catch (error) {
  console.error('❌ Error registering commands:', error);
}

// Event: Bot ready
client.once('clientReady', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} guild(s)`);
});

// Event: Handle ALL interactions (commands AND buttons)
client.on('interactionCreate', async interaction => {
  try {
    // Handle Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      await command.execute(interaction);
    }
    
    // Handle other interaction types if needed
    else {
      console.log(`[Interaction] Unknown type: ${interaction.type}`);
    }
    
  } catch (error) {
    console.error('[Interaction] Error:', error);
    
    const errorMessage = '❌ There was an error processing this interaction!';
    
    try {
      // Check if interaction is already acknowledged
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, flags: [MessageFlags.Ephemeral] });
      } else {
        // Double check the error code to see if it was already acknowledged but the state didn't update
        await interaction.reply({ content: errorMessage, flags: [MessageFlags.Ephemeral] });
      }
    } catch (replyError) {
      // Handle the case where it was already acknowledged despite our check
      if (replyError.code === 40060 || replyError.message.includes('already been acknowledged')) {
        try {
          await interaction.followUp({ content: errorMessage, flags: [MessageFlags.Ephemeral] });
        } catch (followUpError) {
          console.error('[Interaction] Failed to send follow-up error:', followUpError.message);
        }
      } else {
        console.error('[Interaction] Failed to send error message:', replyError.message);
      }
    }
  }
});

client.on('error', error => {
  console.error('Discord client error:', error);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);