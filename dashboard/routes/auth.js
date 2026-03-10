const express = require('express');
const passport = require('passport');
const router = express.Router();
router.get('/discord', passport.authenticate('discord'));
router.get('/callback', passport.authenticate('discord', { successRedirect: '/dashboard', failureRedirect: '/?error=auth' }));
router.get('/logout', (req, res) => { req.logout(() => res.redirect('/')); });
module.exports = router;
