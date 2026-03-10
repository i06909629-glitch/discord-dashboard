const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(__dirname + '/views'));

app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));

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

app.use('/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));

// Route dashboard (protégée)
app.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');
  res.sendFile(__dirname + '/views/dashboard.html');
});

app.get('/invite', (req, res) => {
  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&scope=bot%20applications.commands`;
  res.redirect(inviteUrl);
});

app.listen(3000, () => console.log('🌐 Dashboard : http://localhost:3000'));
