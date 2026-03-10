const {
  Client, GatewayIntentBits, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, PermissionFlagsBits, AuditLogEvent
} = require('discord.js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.MessageContent,
  ]
});

client.modLogs  = [];
client.warnings = {};
client.tickets  = {};

const blagues = [
  "Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que sinon ils tomberaient dans le bateau ! 😂",
  "Un homme entre dans une bibliothèque : 'Vous avez des livres sur la paranoïa ?' — 'Ils sont juste derrière vous...' 👀",
  "Comment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël ? Un chat-peint de Noël ! 🎄",
  "Qu'est-ce qu'un crocodile qui surveille la cour d'école ? Un sac à dents ! 🎒",
  "C'est deux antennes qui se marient. La cérémonie était nulle mais la réception était super ! 📡",
  "Pourquoi Superman porte-t-il son slip par-dessus son pantalon ? Pour avoir les courants d'air en dessous ! 💨",
  "Qu'est-ce qu'un canif ? Un petit fien ! 🐕",
  "Pourquoi les mathématiciens ont-ils peur des araignées ? Parce que ce sont des eight-angles ! 🕷️",
];

const reponses8ball = [
  "✅ Oui, absolument !", "✅ C'est certain.", "✅ Sans aucun doute.",
  "🤔 C'est probable.", "🤔 Je ne peux pas te le dire maintenant.",
  "❌ Ne compte pas là-dessus.", "❌ Ma réponse est non.", "❌ Les perspectives ne sont pas bonnes.",
];

client.once('ready', () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
  console.log(`🚀 Dashboard sur http://localhost:3000`);
});

client.on('guildBanAdd', (ban) => {
  client.modLogs.unshift({
    id: Date.now(), type: 'BAN',
    user: ban.user.tag, userId: ban.user.id,
    avatar: ban.user.displayAvatarURL(),
    guild: ban.guild.name, guildId: ban.guild.id,
    reason: ban.reason || 'Aucune raison', moderator: 'Système',
    date: new Date().toISOString(),
  });
});

client.on('guildMemberRemove', async (member) => {
  try {
    const logs = await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 });
    const entry = logs.entries.first();
    if (entry && entry.target.id === member.id && Date.now() - entry.createdTimestamp < 5000) {
      client.modLogs.unshift({
        id: Date.now(), type: 'KICK',
        user: member.user.tag, userId: member.id,
        avatar: member.user.displayAvatarURL(),
        guild: member.guild.name, guildId: member.guild.id,
        reason: entry.reason || 'Aucune raison', moderator: entry.executor?.tag || 'Inconnu',
        date: new Date().toISOString(),
      });
    }
  } catch (_) {}
});

client.on('interactionCreate', async (interaction) => {

  // Bouton fermer ticket
  if (interaction.isButton() && interaction.customId === 'fermer_ticket') {
    const embed = new EmbedBuilder().setColor(0xed4245).setTitle('🎫 Ticket fermé')
      .setDescription(`Fermé par ${interaction.user.tag}`).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
    delete client.tickets[interaction.channelId];
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;

  // ── MODÉRATION ────────────────────────────────────────────

  if (commandName === 'ban') {
    const target = interaction.options.getUser('utilisateur');
    const reason = interaction.options.getString('raison') || 'Aucune raison';
    try {
      await interaction.guild.members.ban(target.id, { reason });
      client.modLogs.unshift({ id: Date.now(), type: 'BAN', user: target.tag, userId: target.id, avatar: target.displayAvatarURL(), guild: interaction.guild.name, guildId: interaction.guildId, reason, moderator: interaction.user.tag, date: new Date().toISOString() });
      const embed = new EmbedBuilder().setColor(0xed4245).setTitle('🔨 Membre banni').addFields({ name: 'Membre', value: target.tag }, { name: 'Raison', value: reason }).setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (e) { await interaction.reply({ content: `❌ ${e.message}`, ephemeral: true }); }
  }

  if (commandName === 'kick') {
    const target = interaction.options.getMember('utilisateur');
    const reason = interaction.options.getString('raison') || 'Aucune raison';
    try {
      await target.kick(reason);
      client.modLogs.unshift({ id: Date.now(), type: 'KICK', user: target.user.tag, userId: target.id, avatar: target.user.displayAvatarURL(), guild: interaction.guild.name, guildId: interaction.guildId, reason, moderator: interaction.user.tag, date: new Date().toISOString() });
      const embed = new EmbedBuilder().setColor(0xfee75c).setTitle('👢 Membre expulsé').addFields({ name: 'Membre', value: target.user.tag }, { name: 'Raison', value: reason }).setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (e) { await interaction.reply({ content: `❌ ${e.message}`, ephemeral: true }); }
  }

  if (commandName === 'warn') {
    const target = interaction.options.getUser('utilisateur');
    const reason = interaction.options.getString('raison') || 'Aucune raison';
    if (!client.warnings[target.id]) client.warnings[target.id] = [];
    client.warnings[target.id].push({ reason, moderator: interaction.user.tag, date: new Date().toISOString() });
    client.modLogs.unshift({ id: Date.now(), type: 'WARN', user: target.tag, userId: target.id, avatar: target.displayAvatarURL(), guild: interaction.guild.name, guildId: interaction.guildId, reason, moderator: interaction.user.tag, date: new Date().toISOString() });
    const embed = new EmbedBuilder().setColor(0x5865f2).setTitle('⚠️ Avertissement').addFields({ name: 'Membre', value: target.tag }, { name: 'Raison', value: reason }, { name: 'Total warns', value: `${client.warnings[target.id].length}` }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }

  // ── TICKETS ───────────────────────────────────────────────

  if (commandName === 'ticket') {
    const sujet = interaction.options.getString('sujet') || 'Support';
    const existing = Object.entries(client.tickets).find(([, t]) => t.userId === interaction.user.id && t.guildId === interaction.guildId);
    if (existing) return interaction.reply({ content: `❌ Tu as déjà un ticket : <#${existing[0]}>`, ephemeral: true });
    try {
      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        ],
      });
      client.tickets[channel.id] = { userId: interaction.user.id, guildId: interaction.guildId, createdAt: new Date().toISOString() };
      const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('fermer_ticket').setLabel('Fermer le ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒'));
      const embed = new EmbedBuilder().setColor(0x5865f2).setTitle(`🎫 Ticket — ${sujet}`).setDescription(`Bonjour ${interaction.user}, l'équipe va te répondre rapidement.\n\nClique sur 🔒 pour fermer le ticket.`).setTimestamp();
      await channel.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: `✅ Ticket créé : ${channel}`, ephemeral: true });
    } catch (e) { await interaction.reply({ content: `❌ ${e.message}`, ephemeral: true }); }
  }

  // ── FUN ───────────────────────────────────────────────────

  if (commandName === 'blague') {
    const blague = blagues[Math.floor(Math.random() * blagues.length)];
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x57f287).setTitle('😂 Blague du jour').setDescription(blague).setTimestamp()] });
  }

  if (commandName === 'pile-ou-face') {
    const result = Math.random() < 0.5 ? '🪙 **Pile !**' : '🪙 **Face !**';
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xfee75c).setTitle('Pile ou Face').setDescription(result).setTimestamp()] });
  }

  if (commandName === 'dé') {
    const faces = interaction.options.getInteger('faces') || 6;
    const result = Math.floor(Math.random() * faces) + 1;
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle('🎲 Lancer de dé').setDescription(`Tu as lancé un **d${faces}** et obtenu : **${result}**`).setTimestamp()] });
  }

  if (commandName === '8ball') {
    const question = interaction.options.getString('question');
    const reponse = reponses8ball[Math.floor(Math.random() * reponses8ball.length)];
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle('🎱 Boule Magique').addFields({ name: '❓ Question', value: question }, { name: '🎱 Réponse', value: reponse }).setTimestamp()] });
  }

  if (commandName === 'avatar') {
    const target = interaction.options.getUser('membre') || interaction.user;
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle(`Avatar de ${target.username}`).setImage(target.displayAvatarURL({ size: 512 })).setTimestamp()] });
  }

  if (commandName === 'serveur') {
    const guild = interaction.guild;
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle(`📊 ${guild.name}`).setThumbnail(guild.iconURL()).addFields({ name: '👥 Membres', value: `${guild.memberCount}`, inline: true }, { name: '💬 Salons', value: `${guild.channels.cache.size}`, inline: true }, { name: '🎭 Rôles', value: `${guild.roles.cache.size}`, inline: true }).setTimestamp()] });
  }
});

client.login(process.env.BOT_TOKEN);
module.exports = client;
