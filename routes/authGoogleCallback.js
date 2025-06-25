const express = require('express');
const passport = require('passport');

module.exports = () => {
  const router = express.Router();
  router.get('/auth/google/callback', (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
      if (err) {
        console.error('Google Auth Error:', err);
        return res.status(500).send('Authentication error');
      }
      if (!user) {
        return res.redirect('/vitals?auth=failure');
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error('Login Error:', err);
          return res.status(500).send('Login error');
        }
        return res.redirect('/vitals/dashboard');
      });
    })(req, res, next);
  });
  return router;
};
