const express = require('express');
const renderPage = require('../views/renderPage');

module.exports = (db) => {
  const router = express.Router();
  router.get('/my-vitals', async (req, res) => {
    if (!req.user) return res.redirect('/vitals');

    try {
      const userId = req.user.id || req.user.emails?.[0]?.value;
      const [results] = await db.query('SELECT * FROM vitals WHERE userId = ? ORDER BY date DESC', [userId]);

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
  return router;
};
