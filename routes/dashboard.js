const express = require('express');
const renderPage = require('../views/renderPage');

module.exports = () => {
  const router = express.Router();
  router.get('/dashboard', (req, res) => {
    if (!req.user) return res.redirect('/vitals');

    const content = `
      <div class="container">
        <div class="header retro-header">
          <h1>🚀 Add New Vitals</h1>
          <p>Atomic age styling, modern comfort. Log your stats from any device.</p>
        </div>
        <div class="form-container retro-form-shell">
          <form class="retro-form" action="/vitals/save" method="POST">
            <div class="form-group">
              <label for="datetime">Date &amp; Time</label>
              <input id="datetime" type="text" name="date" required>
            </div>

            <div class="form-group">
              <label for="heart_rate">Heart Rate</label>
              <input id="heart_rate" type="number" name="heart_rate" placeholder="Beats per minute">
            </div>

            <div class="form-group">
              <label for="blood_pressure">Blood Pressure</label>
              <input id="blood_pressure" type="text" name="blood_pressure" placeholder="120/80">
            </div>

            <div class="form-group">
              <label for="temperature">Temperature</label>
              <input id="temperature" type="number" step="0.1" name="temperature" placeholder="°F">
            </div>

            <div class="form-group">
              <label for="weight_lbs">Weight</label>
              <input id="weight_lbs" type="number" step="0.1" name="weight_lbs" placeholder="lbs">
            </div>

            <div class="form-group">
              <label for="blood_oxygen">O₂ Saturation</label>
              <input id="blood_oxygen" type="number" step="0.1" name="blood_oxygen" placeholder="%">
            </div>

	    <div class="button-container">
              <button type="submit" id="submitBtn">
              <span class="btn-text">➕ Submit</span>
              <span class="btn-spinner" style="display: none;"></span>
            </button>
	   </div>
          </form>
        </div>
      </div>
      <script>
        flatpickr("#datetime", {
          enableTime: true,
          dateFormat: "Y-m-d H:i",
          defaultDate: "now",
          time_24hr: true,
        });
      </script>

    `;
    res.send(renderPage(content, req.user));
  });
  return router;
};
