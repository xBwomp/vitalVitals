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

function highest(values) {
  const validValues = values.filter(value => typeof value === 'number' && !Number.isNaN(value));
  if (validValues.length === 0) return '—';
  return Math.max(...validValues).toFixed(1);
}

function lowest(values) {
  const validValues = values.filter(value => typeof value === 'number' && !Number.isNaN(value));
  if (validValues.length === 0) return '—';
  return Math.min(...validValues).toFixed(1);
}

function metricSummary(values, unit) {
  return `${average(values)}${unit} (H: ${highest(values)}${unit}, L: ${lowest(values)}${unit})`;
}

function buildAverageCard(label, records) {
  const parsedPressures = records.map(row => parseBloodPressure(row.blood_pressure));
  const systolicValues = parsedPressures.map(bp => bp.systolic);
  const diastolicValues = parsedPressures.map(bp => bp.diastolic);

  return `
    <div class="avg-card">
      <h3>${label}</h3>
      <ul>
        <li><strong>Heart Rate:</strong> ${metricSummary(records.map(row => Number(row.heart_rate)), ' bpm')}</li>
        <li><strong>Blood Pressure:</strong> ${average(systolicValues)}/${average(diastolicValues)} (H: ${highest(systolicValues)}/${highest(diastolicValues)}, L: ${lowest(systolicValues)}/${lowest(diastolicValues)})</li>
        <li><strong>Temperature:</strong> ${metricSummary(records.map(row => Number(row.temperature)), ' °F')}</li>
        <li><strong>Weight:</strong> ${metricSummary(records.map(row => Number(row.weight_lbs)), ' lbs')}</li>
        <li><strong>O₂ Saturation:</strong> ${metricSummary(records.map(row => Number(row.blood_oxygen)), '%')}</li>
      </ul>
    </div>
  `;
}

module.exports = (db) => {
  const router = express.Router();
  router.get('/my-vitals', async (req, res) => {
    if (!req.user) return res.redirect('/vitals');

    try {
      const userId = req.user.id || req.user.emails?.[0]?.value;
      // Fetch the last 3 months of records for the logged in user
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

      let tableBody = '';
      if (results.length === 0) {
        tableBody = `<tr><td colspan="6" class="no-vitals">No vitals found.</td></tr>`;
      } else {
        tableBody = results.map(row => {
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
              <td data-label="Date">
                ${formattedDate}<br>
                <span style="font-size: 0.85em; color: #666;">${formattedTime}</span>
              </td>
              <td data-label="Heart Rate">${row.heart_rate}</td>
              <td data-label="Blood Pressure">${row.blood_pressure}</td>
              <td data-label="Temperature">${row.temperature}</td>
              <td data-label="Weight">
                ${row.weight_lbs} lbs<br>
                <span style="font-size: 0.85em; color: #666;">(${weightKg} kg)</span>
              </td>
              <td data-label="O₂ Saturation" title="O₂ Saturation">${row.blood_oxygen ?? ''}</td>
            </tr>
          `;
        }).join('');
      }

      const content = `
        <div class="container">
          <div class="header">
            <h1>📊 Your Vitals</h1>
            <p>Review your previously logged health entries.</p>
            <a href="/vitals/chart" class="chart-link">View Chart</a>
            <a href="/vitals/export" title="Export to CSV/Excel" class="export-link">
              <span role="img" aria-label="Export">📄</span>
            </a>
          </div>
          ${averageCards}
          <div class="card">
            <div class="card-header">
              <h2>Recent Entries</h2>
            </div>
            <div class="card-body">
              <div class="table-container">
                <table class="vitals-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Heart Rate</th>
                      <th>Blood Pressure</th>
                      <th>Temperature</th>
                      <th>Weight</th>
                      <th>O₂ Saturation</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableBody}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `;

      res.send(renderPage(content, req.user));
    } catch (err) {
      console.error('❌ Failed to load vitals:', err);
      res.send('Error loading vitals');
    }
  });
  return router;
};
