const express = require('express');
const passport = require('passport');
const renderPage = require('../views/renderPage');
const { stringify } = require('csv-stringify/sync');

module.exports = (db) => {
  const router = express.Router();

  router.get('/', (req, res) => {
    const content = `
      <div class="container">
        <div class="header">
          <h1>🩺 Vitals Tracker</h1>
          <p>Track your blood pressure and health metrics</p>
        </div>
        <div class="form-container" style="text-align:center;">
          <a href="/vitals/auth/google" style="text-decoration:none;">
            <button type="button" style="display:flex;align-items:center;gap:12px;padding:14px 24px;background:linear-gradient(270deg,#ff4d4d,#ffcc00,#33cc33,#3399ff,#cc33cc);background-size:400% 400%;animation:rainbowShift 10s ease infinite;border:none;border-radius:12px;cursor:pointer;color:white;font-weight:600;font-size:16px;box-shadow:0 0 12px rgba(255,255,255,0.15);transition:transform 0.2s,box-shadow 0.3s;">
              <span style="background:white;border-radius:50%;width:24px;height:24px;display:grid;place-items:center;">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style="width:18px;height:18px;" />
              </span>
              Sign in with Google
            </button>
          </a>
          <style>
            @keyframes rainbowShift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .google-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 0 18px rgba(255,255,255,0.3);
            }
          </style>
        </div>
      </div>
    `;
    res.send(renderPage(content, req.user));
  });

  router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

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

  router.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/vitals'));
  });

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
            <button type="submit">Submit</button>
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

  router.post('/save', async (req, res) => {
    if (!req.user) return res.redirect('/vitals');

    let { date, heart_rate, blood_pressure, temperature, weight_lbs } = req.body;
    const userId = req.user.id || req.user.emails?.[0]?.value;

    // Ensure date is in 'YYYY-MM-DD HH:MM:SS' format
    if (date && date.length === 16) { // 'YYYY-MM-DD HH:MM'
      date = date + ':00';
    }

    try {
      const query = 'INSERT INTO vitals (userId, date, heart_rate, blood_pressure, temperature, weight_lbs) VALUES (?, ?, ?, ?, ?, ?)';
      await db.query(query, [userId, date, heart_rate, blood_pressure, temperature, weight_lbs]);
      res.redirect('/vitals/my-vitals');
    } catch (err) {
      console.error('❌ Failed to save vitals:', err);

      // ✅ Manually log to a file
      const fs = require('fs');
      fs.appendFileSync('vitals-error.log', `[${new Date().toISOString()}] Failed to save vitals: ${err.message}\n`);
      
      res.send('Error saving vitals');
    }
  });

  router.get('/my-vitals', async (req, res) => {
    if (!req.user) return res.redirect('/vitals');

    try {
      const userId = req.user.id || req.user.emails?.[0]?.value;
      const [results] = await db.query('SELECT * FROM vitals WHERE userId = ? ORDER BY date DESC', [userId]);

      // Prepare data arrays for charting (use last 25 results)
      const chartResults = results.slice(0, 25);
      const dates = [];
      const heartRates = [];
      const bloodPressures = [];
      const temperatures = [];
      const weights = [];

      chartResults.forEach(row => {
        const d = new Date(row.date);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yyyy = d.getFullYear();
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const formattedDate = `${mm}/${dd}/${yyyy}`;
        const formattedTime = `${hours}:${minutes} ${ampm}`;
        dates.push(`${formattedDate} ${formattedTime}`);
        heartRates.push(row.heart_rate);
        bloodPressures.push(row.blood_pressure);
        temperatures.push(row.temperature);
        weights.push(row.weight_lbs);
      });

      // Only show the last 5 entries in the table
      let tableBody = '';
      if (results.length === 0) {
        tableBody = `<tr><td colspan="5" style="text-align:center; color:#888;">No vitals found.</td></tr>`;
      } else {
        const displayResults = results.slice(0, 5);
        tableBody = displayResults.map(row => {
          const d = new Date(row.date);
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const yyyy = d.getFullYear();
          let hours = d.getHours();
          const minutes = String(d.getMinutes()).padStart(2, '0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12;
          hours = hours ? hours : 12;
          const formattedDate = `${mm}/${dd}/${yyyy}`;
          const formattedTime = `${hours}:${minutes} ${ampm}`;
          const weightKg = (row.weight_lbs * 0.453592).toFixed(1);
          return `
            <tr>
              <td>
                ${formattedDate}<br>
                <span style="font-size: 0.85em; color: #666;">${formattedTime}</span>
              </td>
              <td>${row.heart_rate}</td>
              <td>${row.blood_pressure}</td>
              <td>${row.temperature}</td>
              <td>
                ${row.weight_lbs} lbs<br>
                <span style="font-size: 0.85em; color: #666;">(${weightKg} kg)</span>
              </td>
            </tr>
          `;
        }).join('');
      }

      // Chart.js script
      const chartScript = `
        <script>
          const chartLabels = ${JSON.stringify(dates)};
          const heartRates = ${JSON.stringify(heartRates)};
          const temperatures = ${JSON.stringify(temperatures)};
          const weights = ${JSON.stringify(weights)};
          const bloodPressures = ${JSON.stringify(bloodPressures)};
          const systolic = bloodPressures.map(bp => parseInt((bp||'').split('/')[0]) || null);
          const diastolic = bloodPressures.map(bp => parseInt((bp||'').split('/')[1]) || null);

          const ctx = document.getElementById('vitalsChart').getContext('2d');
          new Chart(ctx, {
            type: 'line',
            data: {
              labels: chartLabels,
              datasets: [
                {
                  label: 'Heart Rate (bpm)',
                  data: heartRates,
                  borderColor: 'rgba(255,99,132,1)',
                  backgroundColor: 'rgba(255,99,132,0.2)',
                  yAxisID: 'y',
                  spanGaps: true
                },
                {
                  label: 'Temperature (°F)',
                  data: temperatures,
                  borderColor: 'rgba(54,162,235,1)',
                  backgroundColor: 'rgba(54,162,235,0.2)',
                  yAxisID: 'y1',
                  spanGaps: true
                },
                {
                  label: 'Weight (lbs)',
                  data: weights,
                  borderColor: 'rgba(255,206,86,1)',
                  backgroundColor: 'rgba(255,206,86,0.2)',
                  yAxisID: 'y2',
                  spanGaps: true
                },
                {
                  label: 'Systolic BP',
                  data: systolic,
                  borderColor: 'rgba(75,192,192,1)',
                  backgroundColor: 'rgba(75,192,192,0.2)',
                  yAxisID: 'y3',
                  spanGaps: true
                },
                {
                  label: 'Diastolic BP',
                  data: diastolic,
                  borderColor: 'rgba(153,102,255,1)',
                  backgroundColor: 'rgba(153,102,255,0.2)',
                  yAxisID: 'y3',
                  spanGaps: true
                }
              ]
            },
            options: {
              responsive: true,
              interaction: { mode: 'index', intersect: false },
              stacked: false,
              plugins: { legend: { position: 'top' } },
              scales: {
                y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Heart Rate' } },
                y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Temperature' }, grid: { drawOnChartArea: false } },
                y2: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Weight' }, grid: { drawOnChartArea: false }, offset: true },
                y3: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Blood Pressure' }, grid: { drawOnChartArea: false }, offset: true }
              }
            }
          });
        </script>
      `;

      const content = `
        <div class="container">
          <div class="header">
            <h1>📊 Your Vitals</h1>
            <p>Review your previously logged health entries.</p>
            <a href="/vitals/export" title="Export to CSV/Excel" style="float:right; font-size:1.5em; text-decoration:none;">
              <span role="img" aria-label="Export">📊</span>
            </a>
          </div>
          <div style="margin-bottom: 24px;">
            <canvas id="vitalsChart" height="120"></canvas>
          </div>
          <div class="table-container" style="max-height: 350px; overflow-y: auto;">
            <table class="vitals-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Heart Rate</th>
                  <th>Blood Pressure</th>
                  <th>Temperature</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                ${tableBody}
              </tbody>
            </table>
          </div>
        </div>
        ${chartScript}
      `;

      res.send(renderPage(content, req.user));
    } catch (err) {
      console.error('❌ Failed to load vitals:', err);
      res.send('Error loading vitals');
    }
  });

  // Export page route
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

  // Placeholder for download route
  router.post('/export/download', async (req, res) => {
    if (!req.user) return res.redirect('/vitals');
    const userId = req.user.id || req.user.emails?.[0]?.value;
    const { start, end, params } = req.body;
    // params can be a string or array depending on how many are checked
    let selectedParams = params;
    if (!selectedParams) {
      return res.send('No parameters selected.');
    }
    if (!Array.isArray(selectedParams)) {
      selectedParams = [selectedParams];
    }
    // Always include date
    const columns = ['date', ...selectedParams];
    // Query DB for the selected range and columns
    try {
      const placeholders = columns.map(() => '??').join(', ');
      const query = `SELECT ${placeholders} FROM vitals WHERE userId = ? AND date BETWEEN ? AND ? ORDER BY date DESC`;
      const [results] = await db.query(query, [...columns, userId, start + ' 00:00:00', end + ' 23:59:59']);
      // Format date for CSV
      const data = results.map(row => {
        const out = {};
        columns.forEach(col => {
          if (col === 'date') {
            const d = new Date(row.date);
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const yyyy = d.getFullYear();
            let hours = d.getHours();
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            out.date = `${mm}/${dd}/${yyyy} ${hours}:${minutes} ${ampm}`;
          } else {
            out[col] = row[col];
          }
        });
        return out;
      });
      // Generate CSV
      const csv = stringify(data, { header: true, columns });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="vitals_export.csv"');
      res.send(csv);
    } catch (err) {
      console.error('❌ Failed to export vitals:', err);
      res.send('Error exporting vitals');
    }
  });

  return router;
};

