const express = require('express');
const { stringify } = require('csv-stringify/sync');

module.exports = (db) => {
  const router = express.Router();
  router.post('/export/download', async (req, res) => {
    if (!req.user) return res.redirect('/vitals');
    const userId = req.user.id || req.user.emails?.[0]?.value;
    const { start, end, params } = req.body;
    let selectedParams = params;
    if (!selectedParams) {
      return res.send('No parameters selected.');
    }
    if (!Array.isArray(selectedParams)) {
      selectedParams = [selectedParams];
    }
    const columns = ['date', ...selectedParams];
    try {
      const placeholders = columns.map(() => '??').join(', ');
      const query = `SELECT ${placeholders} FROM vitals WHERE userId = ? AND date BETWEEN ? AND ? ORDER BY date DESC`;
      const [results] = await db.query(query, [...columns, userId, start + ' 00:00:00', end + ' 23:59:59']);
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
