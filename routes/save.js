const express = require('express');
const fs = require('fs');

module.exports = (db) => {
  const router = express.Router();
  router.post('/save', async (req, res) => {
    if (!req.user) return res.redirect('/vitals');

    let { date, heart_rate, blood_pressure, temperature, weight_lbs } = req.body;
    const userId = req.user.id || req.user.emails?.[0]?.value;

    if (date && date.length === 16) {
      date = date + ':00';
    }

    try {
      const query = 'INSERT INTO vitals (userId, date, heart_rate, blood_pressure, temperature, weight_lbs) VALUES (?, ?, ?, ?, ?, ?)';
      await db.query(query, [userId, date, heart_rate, blood_pressure, temperature, weight_lbs]);
      res.redirect('/vitals/my-vitals');
    } catch (err) {
      console.error('❌ Failed to save vitals:', err);
      fs.appendFileSync('vitals-error.log', `[${new Date().toISOString()}] Failed to save vitals: ${err.message}\n`);
      res.send('Error saving vitals');
    }
  });
  return router;
};
