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
            <input id="datetime" type="text" name="date" required><br>
            <input type="number" name="heart_rate" placeholder="Heart Rate (bpm)"><br>
            <input type="text" name="blood_pressure" placeholder="Blood Pressure (e.g., 120/80)"><br>
            <input type="number" step="0.1" name="temperature" placeholder="Temperature (°F)"><br>
            <input type="number" step="0.1" name="weight_lbs" placeholder="Weight (lbs)"><br>
            <input type="number" step="0.1" name="blood_oxygen" placeholder="Blood Oxygen (%)"><br>

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
        });
      </script>
   <script>
  document.addEventListener("DOMContentLoaded", function () {
    const dtInput = document.getElementById('datetime');
    if (dtInput && !dtInput.value) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // adjust for timezone
      dtInput.value = now.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
    }
  });
</script>

    `;
    res.send(renderPage(content, req.user));
  });
  return router;
};
