const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const path = require('path');
const client = require('../bot/index');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

passport.use(new Strategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL,
  scope: ['identify', 'guilds'],
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/callback',
  passport.authenticate('discord', { failureRedirect: '/?error=1' }),
  (req, res) => res.redirect('/dashboard')
);
app.get('/auth/logout', (req, res) => req.logout(() => res.redirect('/')));
app.get('/auth/me', (req, res) => {
  if (!req.isAuthenticated()) return res.json(null);
  res.json({
    id: req.user.id,
    username: req.user.username,
    avatar: req.user.avatar
      ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/0.png`
  });
});

const isAuth = (req, res, next) => req.isAuthenticated() ? next() : res.status(401).json({ error: 'Non authentifié' });

app.get('/api/guilds', isAuth, (req, res) => {
  const userGuilds = req.user.guilds.filter(g => (BigInt(g.permissions) & BigInt(0x8)) === BigInt(0x8));
  const botGuildIds = client.guilds.cache.map(g => g.id);
  res.json(userGuilds.filter(g => botGuildIds.includes(g.id)).map(g => ({
    id: g.id, name: g.name,
    icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null
  })));
});

app.get('/api/guild/:id/stats', isAuth, async (req, res) => {
  const guild = client.guilds.cache.get(req.params.id);
  if (!guild) return res.status(404).json({ error: 'Introuvable' });
  await guild.members.fetch();
  const logs = client.modLogs.filter(l => l.guildId === req.params.id);
  res.json({ name: guild.name, memberCount: guild.memberCount, icon: guild.iconURL(),
    bans: logs.filter(l => l.type === 'BAN').length, kicks: logs.filter(l => l.type === 'KICK').length,
    warns: logs.filter(l => l.type === 'WARN').length, channels: guild.channels.cache.size, roles: guild.roles.cache.size });
});

app.get('/api/guild/:id/members', isAuth, async (req, res) => {
  const guild = client.guilds.cache.get(req.params.id);
  if (!guild) return res.status(404).json({ error: 'Introuvable' });
  const members = await guild.members.fetch();
  res.json(members.filter(m => !m.user.bot).map(m => ({
    id: m.id, tag: m.user.tag, avatar: m.user.displayAvatarURL({ size: 64 }),
    joinedAt: m.joinedAt, roles: m.roles.cache.filter(r => r.name !== '@everyone').map(r => ({ id: r.id, name: r.name, color: r.hexColor })),
    warnings: (client.warnings[m.id] || []).length
  })).slice(0, 100));
});

app.get('/api/guild/:id/logs', isAuth, (req, res) => {
  res.json(client.modLogs.filter(l => l.guildId === req.params.id).sort((a, b) => b.date.localeCompare(a.date)));
});

app.post('/api/guild/:guildId/ban/:userId', isAuth, async (req, res) => {
  const guild = client.guilds.cache.get(req.params.guildId);
  if (!guild) return res.status(404).json({ error: 'Introuvable' });
  try {
    const user = await client.users.fetch(req.params.userId);
    await guild.members.ban(req.params.userId, { reason: req.body.reason || 'Via dashboard' });
    client.modLogs.unshift({ id: Date.now(), type: 'BAN', user: user.tag, userId: user.id, avatar: user.displayAvatarURL(), guild: guild.name, guildId: guild.id, reason: req.body.reason || 'Via dashboard', moderator: req.user.username, date: new Date().toISOString() });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/guild/:guildId/kick/:userId', isAuth, async (req, res) => {
  const guild = client.guilds.cache.get(req.params.guildId);
  if (!guild) return res.status(404).json({ error: 'Introuvable' });
  try {
    const member = await guild.members.fetch(req.params.userId);
    await member.kick(req.body.reason || 'Via dashboard');
    client.modLogs.unshift({ id: Date.now(), type: 'KICK', user: member.user.tag, userId: member.id, avatar: member.user.displayAvatarURL(), guild: guild.name, guildId: guild.id, reason: req.body.reason || 'Via dashboard', moderator: req.user.username, date: new Date().toISOString() });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/guild/:guildId/warn/:userId', isAuth, async (req, res) => {
  const guild = client.guilds.cache.get(req.params.guildId);
  if (!guild) return res.status(404).json({ error: 'Introuvable' });
  try {
    const user = await client.users.fetch(req.params.userId);
    if (!client.warnings[req.params.userId]) client.warnings[req.params.userId] = [];
    client.warnings[req.params.userId].push({ reason: req.body.reason, moderator: req.user.username, date: new Date().toISOString() });
    client.modLogs.unshift({ id: Date.now(), type: 'WARN', user: user.tag, userId: user.id, avatar: user.displayAvatarURL(), guild: guild.name, guildId: guild.id, reason: req.body.reason || 'Aucune raison', moderator: req.user.username, date: new Date().toISOString() });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/invite', (req, res) => res.redirect(`https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&scope=bot%20applications.commands`));
app.get('/dashboard', (req, res) => req.isAuthenticated() ? res.sendFile(path.join(__dirname, 'views/dashboard.html')) : res.redirect('/'));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'views/index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Dashboard : http://localhost:${PORT}`));
