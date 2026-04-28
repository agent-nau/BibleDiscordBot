import { MessageFlags } from 'discord.js';

export function isOwner(userId) {
  const ownerId = process.env.OWNER_ID;
  if (!ownerId) {
    console.warn('⚠️ OWNER_ID environment variable is not set');
    return false;
  }
  return userId === ownerId;
}

export async function checkOwner(interaction) {
  if (!isOwner(interaction.user.id)) {
    await interaction.reply({
      content: '❌ This command is only available to the bot owner.',
      flags: [MessageFlags.Ephemeral]
    });
    return false;
  }
  return true;
}