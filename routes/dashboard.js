const express = require('express');
const renderPage = require('../views/renderPage');

module.exports = () => {
  const router = express.Router();
  router.get('/dashboard', (req, res) => {
    if (!req.user) return res.redirect('/vitals');

    const content = `
      <div class="container">
        <div class="header">
          <h1>📝 Add New Vitals</h1>
          <p>Enter your latest health metrics below.</p>
        </div>
        <div class="form-container">
          <form action="/vitals/save" method="POST">
            <label for="datetime">Date & Time</label>
            <input id="datetime" type="text" name="date" required><br>
            <input type="number" name="heart_rate" placeholder="Heart Rate (bpm)"><br>
            <input type="text" name="blood_pressure" placeholder="Blood Pressure (e.g., 120/80)"><br>
            <input type="number" step="0.1" name="temperature" placeholder="Temperature (°F)"><br>
            <input type="number" step="0.1" name="weight_lbs" placeholder="Weight (lbs)"><br>
            <button type="submit" id="submitBtn">
              <span class="btn-text">➕ Submit</span>
              <span class="btn-spinner" style="display: none;"></span>
            </button>
          </form>
        </div>
      </div>
      <script>
        flatpickr("#datetime", {
          enableTime: true,
          dateFormat: "Y-m-d H:i",
        });
      </script>
    `;
    res.send(renderPage(content, req.user));
  });
  return router;
};
