const express = require('express');
const router = express.Router();
const client = require('../../bot/index');
const isAuth = (req, res, next) => req.isAuthenticated() ? next() : res.status(401).json({ error: 'Non authentifié' });

router.get('/me', isAuth, (req, res) => res.json(req.user));

router.get('/guilds', isAuth, (req, res) => {
  const botGuildIds = client.guilds.cache.map(g => g.id);
  const adminGuilds = req.user.guilds.filter(g => (BigInt(g.permissions) & BigInt(0x8)) === BigInt(0x8) && botGuildIds.includes(g.id));
  res.json(adminGuilds);
});

router.get('/stats', isAuth, (req, res) => {
  res.json({ ...client.stats, guilds: client.guilds.cache.size, users: client.users.cache.size, uptime: Math.floor(client.uptime / 1000) });
});

router.get('/guild/:id/members', isAuth, async (req, res) => {
  const guild = client.guilds.cache.get(req.params.id);
  if (!guild) return res.status(404).json({ error: 'Serveur introuvable' });
  try {
    const members = await guild.members.fetch();
    res.json(members.map(m => ({ id: m.id, tag: m.user.tag, avatar: m.user.displayAvatarURL({ size: 64 }), joinedAt: m.joinedAt, roles: m.roles.cache.filter(r => r.name !== '@everyone').map(r => ({ id: r.id, name: r.name, color: r.hexColor })), warnings: (client.warnings[m.id] || []).filter(w => w.guildId === req.params.id).length })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/guild/:id/logs', isAuth, (req, res) => res.json(client.modLogs.filter(l => l.guildId === req.params.id)));

router.post('/guild/:guildId/ban/:userId', isAuth, async (req, res) => {
  const guild = client.guilds.cache.get(req.params.guildId);
  if (!guild) return res.status(404).json({ error: 'Serveur introuvable' });
  try { await guild.members.ban(req.params.userId, { reason: req.body.reason || 'Via dashboard' }); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/guild/:guildId/kick/:userId', isAuth, async (req, res) => {
  const guild = client.guilds.cache.get(req.params.guildId);
  if (!guild) return res.status(404).json({ error: 'Serveur introuvable' });
  try { const member = await guild.members.fetch(req.params.userId); await member.kick(req.body.reason || 'Via dashboard'); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/guild/:guildId/warn/:userId', isAuth, async (req, res) => {
  const { guildId, userId } = req.params;
  const reason = req.body.reason || 'Via dashboard';
  if (!client.warnings[userId]) client.warnings[userId] = [];
  client.warnings[userId].push({ reason, date: new Date().toISOString(), guildId });
  client.stats.warns++;
  const guild = client.guilds.cache.get(guildId);
  const member = guild?.members.cache.get(userId);
  client.modLogs.unshift({ id: Date.now(), type: 'WARN', user: member?.user.tag || userId, userId, avatar: member?.user.displayAvatarURL() || '', guild: guild?.name || guildId, guildId, reason, moderator: req.user.username, date: new Date().toISOString() });
  res.json({ success: true });
});

router.delete('/guild/:guildId/ban/:userId', isAuth, async (req, res) => {
  const guild = client.guilds.cache.get(req.params.guildId);
  if (!guild) return res.status(404).json({ error: 'Serveur introuvable' });
  try { await guild.members.unban(req.params.userId); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
