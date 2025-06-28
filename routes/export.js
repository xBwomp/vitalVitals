const express = require('express');
const renderPage = require('../views/renderPage');

module.exports = () => {
  const router = express.Router();
  router.get('/export', (req, res) => {
    if (!req.user) return res.redirect('/vitals');
    const content = `
      <div class="container">
        <div class="header">
          <h1>📤 Export Vitals Data</h1>
          <p>Select a date range and which parameters to export.</p>
        </div>
        <div class="form-container">
          <form action="/vitals/export/download" method="POST">
            <label for="start">Start Date:</label><br>
            <input type="date" id="start" name="start" required><br><br>
            <label for="end">End Date:</label><br>
            <input type="date" id="end" name="end" required><br><br>
            <label>Parameters to export:</label><br>
            <input type="checkbox" name="params" value="heart_rate" checked> Heart Rate<br>
            <input type="checkbox" name="params" value="blood_pressure" checked> Blood Pressure<br>
            <input type="checkbox" name="params" value="temperature" checked> Temperature<br>
            <input type="checkbox" name="params" value="weight_lbs" checked> Weight<br><br>
            <button type="submit">Export</button>
          </form>
        </div>
      </div>
    `;
    res.send(renderPage(content, req.user));
  });
  return router;
};
