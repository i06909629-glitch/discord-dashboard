const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const commands = [
  // Modération
  new SlashCommandBuilder().setName('ban').setDescription('Bannir un membre')
    .addUserOption(o => o.setName('utilisateur').setDescription('Membre à bannir').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison du ban')),

  new SlashCommandBuilder().setName('kick').setDescription('Expulser un membre')
    .addUserOption(o => o.setName('utilisateur').setDescription('Membre à expulser').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison')),

  new SlashCommandBuilder().setName('warn').setDescription('Avertir un membre')
    .addUserOption(o => o.setName('utilisateur').setDescription('Membre à avertir').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison')),

  // Tickets
  new SlashCommandBuilder().setName('ticket').setDescription('Ouvrir un ticket de support')
    .addStringOption(o => o.setName('sujet').setDescription('Sujet du ticket')),

  // Fun
  new SlashCommandBuilder().setName('blague').setDescription('Envoie une blague aléatoire'),
  new SlashCommandBuilder().setName('pile-ou-face').setDescription('Lance une pièce'),
  new SlashCommandBuilder().setName('dé').setDescription('Lance un dé')
    .addIntegerOption(o => o.setName('faces').setDescription('Nombre de faces (défaut: 6)').setMinValue(2).setMaxValue(100)),
  new SlashCommandBuilder().setName('8ball').setDescription('Pose une question à la boule magique')
    .addStringOption(o => o.setName('question').setDescription('Ta question').setRequired(true)),
  new SlashCommandBuilder().setName('avatar').setDescription("Affiche l'avatar d'un membre")
    .addUserOption(o => o.setName('membre').setDescription('Membre (toi par défaut)')),
  new SlashCommandBuilder().setName('serveur').setDescription('Infos sur le serveur'),
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('⏳ Enregistrement des commandes slash...');
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log('✅ Commandes enregistrées avec succès !');
    console.log('📋 Commandes disponibles :');
    commands.forEach(c => console.log(`   /${c.name} — ${c.description}`));
  } catch (error) {
    console.error('❌ Erreur :', error);
  }
})();
