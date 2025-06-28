const express = require('express');

module.exports = () => {
  const router = express.Router();
  router.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/vitals'));
  });
  return router;
};
