const express = require('express');
const renderPage = require('../views/renderPage');

function parseBloodPressure(bp) {
  const [systolicRaw, diastolicRaw] = String(bp || '').split('/');
  const systolic = Number.parseInt(systolicRaw, 10);
  const diastolic = Number.parseInt(diastolicRaw, 10);

  return {
    systolic: Number.isNaN(systolic) ? null : systolic,
    diastolic: Number.isNaN(diastolic) ? null : diastolic
  };
}

function average(values) {
  const validValues = values.filter(value => typeof value === 'number' && !Number.isNaN(value));
  if (validValues.length === 0) return '—';
  return (validValues.reduce((sum, value) => sum + value, 0) / validValues.length).toFixed(1);
}

function buildAverageCard(label, records) {
  const parsedPressures = records.map(row => parseBloodPressure(row.blood_pressure));

  return `
    <div class="avg-card">
      <h3>${label}</h3>
      <ul>
        <li><strong>Heart Rate:</strong> ${average(records.map(row => Number(row.heart_rate)))} bpm</li>
        <li><strong>Blood Pressure:</strong> ${average(parsedPressures.map(bp => bp.systolic))}/${average(parsedPressures.map(bp => bp.diastolic))}</li>
        <li><strong>Temperature:</strong> ${average(records.map(row => Number(row.temperature)))} °F</li>
        <li><strong>Weight:</strong> ${average(records.map(row => Number(row.weight_lbs)))} lbs</li>
        <li><strong>O₂ Saturation:</strong> ${average(records.map(row => Number(row.blood_oxygen)))}%</li>
      </ul>
    </div>
  `;
}

module.exports = (db) => {
  const router = express.Router();

  router.get('/chart', async (req, res) => {
    if (!req.user) return res.redirect('/vitals');

    try {
      const userId = req.user.id || req.user.emails?.[0]?.value;
      const [results] = await db.query(
        'SELECT * FROM vitals WHERE userId = ? AND date >= DATE_SUB(NOW(), INTERVAL 90 DAY) ORDER BY date DESC',
        [userId]
      );

      const now = Date.now();
      const lastSevenDays = results.filter(row => (now - new Date(row.date).getTime()) <= (7 * 24 * 60 * 60 * 1000));
      const lastThirtyDays = results.filter(row => (now - new Date(row.date).getTime()) <= (30 * 24 * 60 * 60 * 1000));
      const averageCards = `
        <div class="avg-cards">
          ${buildAverageCard('Last 5 Entries Average', results.slice(0, 5))}
          ${buildAverageCard('7 Day Average', lastSevenDays)}
          ${buildAverageCard('30 Day Average', lastThirtyDays)}
        </div>
      `;

      const dates = [];
      const heartRates = [];
      const bloodPressures = [];
      const temperatures = [];
      const weights = [];
      const bloodOxygens = [];

      results.forEach(row => {
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
        bloodOxygens.push(row.blood_oxygen);
      });

      const chartScript = `
        <script>
          const chartLabels = ${JSON.stringify(dates)};
          const heartRates = ${JSON.stringify(heartRates)};
          const temperatures = ${JSON.stringify(temperatures)};
          const weights = ${JSON.stringify(weights)};
          const bloodPressures = ${JSON.stringify(bloodPressures)};
          const bloodOxygens = ${JSON.stringify(bloodOxygens)};
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
                  borderColor: '#ff6b81',
                  backgroundColor: 'rgba(255, 107, 129, 0.2)',
                  yAxisID: 'y',
                  spanGaps: true,
                  tension: 0.4
                },
                {
                  label: 'Temperature (°F)',
                  data: temperatures,
                  borderColor: '#4bc0c0',
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  yAxisID: 'y1',
                  spanGaps: true,
                  tension: 0.4
                },
                {
                  label: 'Weight (lbs)',
                  data: weights,
                  borderColor: '#ffcd56',
                  backgroundColor: 'rgba(255, 205, 86, 0.2)',
                  yAxisID: 'y2',
                  spanGaps: true,
                  tension: 0.4
                },
                {
                  label: 'Systolic BP',
                  data: systolic,
                  borderColor: '#6c5ce7',
                  backgroundColor: 'rgba(108, 92, 231, 0.2)',
                  yAxisID: 'y3',
                  spanGaps: true,
                  tension: 0.4
                },
                {
                  label: 'Diastolic BP',
                  data: diastolic,
                  borderColor: '#a29bfe',
                  backgroundColor: 'rgba(162, 155, 254, 0.2)',
                  yAxisID: 'y3',
                  spanGaps: true,
                  tension: 0.4
                },
                {
                  label: 'O₂ Saturation (%)',
                  data: bloodOxygens,
                  borderColor: '#00b894',
                  backgroundColor: 'rgba(0, 184, 148, 0.2)',
                  yAxisID: 'y4',
                  spanGaps: true,
                  tension: 0.4
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
                y3: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Blood Pressure' }, grid: { drawOnChartArea: false }, offset: true },
                y4: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'O₂ Saturation' }, grid: { drawOnChartArea: false }, offset: true }
              }
            }
          });
        </script>
      `;

      const content = `
        <div class="container">
          <div class="header">
            <h1>📈 Vitals Chart</h1>
            <p>Visualize your vitals over the last 3 months.</p>
            <a href="/vitals/my-vitals" class="chart-link">Back to Entries</a>
          </div>
          ${averageCards}
          <div class="card">
            <div class="card-body">
              <canvas id="vitalsChart" height="150"></canvas>
            </div>
          </div>
        </div>
        ${chartScript}
      `;

      res.send(renderPage(content, req.user));
    } catch (err) {
      console.error('❌ Failed to load chart:', err);
      res.send('Error loading chart');
    }
  });

  return router;
};
