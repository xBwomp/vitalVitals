const express = require('express');
const passport = require('passport');

module.exports = () => {
  const router = express.Router();
  router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );
  return router;
};
