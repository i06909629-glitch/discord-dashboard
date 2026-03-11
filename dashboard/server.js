const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret123',
  resave: false,
  saveUninitialized: false
}));

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL;

// Auth Discord OAuth2 manuel
app.get('/auth/discord', (req, res) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    response_type: 'code',
    scope: 'identify guilds'
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect('/?error=1');
  try {
    const tokenRes = await axios.post('https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: CALLBACK_URL
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const token = tokenRes.data.access_token;
    const [userRes, guildsRes] = await Promise.all([
      axios.get('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    req.session.user = { ...userRes.data, guilds: guildsRes.data };
    res.redirect('/dashboard');
  } catch (e) {
    console.error('OAuth error:', e.response?.data || e.message);
    res.redirect('/?error=1');
  }
});

app.get('/auth/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/auth/me', (req, res) => {
  if (!req.session.user) return res.json(null);
  const u = req.session.user;
  res.json({
    id: u.id,
    username: u.username,
    avatar: u.avatar
      ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/0.png`
  });
});

const isAuth = (req, res, next) => req.session.user ? next() : res.status(401).json({ error: 'Non authentifié' });

app.get('/api/guilds', isAuth, (req, res) => {
  const guilds = req.session.user.guilds
    .filter(g => (BigInt(g.permissions) & BigInt(0x8)) === BigInt(0x8))
    .map(g => ({
      id: g.id, name: g.name,
      icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null
    }));
  res.json(guilds);
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'views/dashboard.html'));
});

app.get('/invite', (req, res) => {
  res.redirect(`https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&scope=bot%20applications.commands`);
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'views/index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Dashboard sur port ${PORT}`));
