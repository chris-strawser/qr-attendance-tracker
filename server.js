// =============================================
// ✅ QR Attendance Tracker (No n8n – Self-Hosted Version)
// =============================================

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

app.post('/api/scan', async (req, res) => {
  const { studentId, name, date, timestamp } = req.body;

  if (!studentId || !name || !date || !timestamp) {
    return res.status(400).send({ error: 'Missing required fields' });
  }

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const getResp = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: 'Daily Attendance Logs!A:G'
    });

    let rows = getResp.data.values || [];
    
    const todayRows = rows.filter(row => row[0] === studentId && row[2] === date);

    // Prevent duplicate scans (same student, same timestamp)
    const isDuplicate = todayRows.some(row => row[3] === timestamp);
    if (isDuplicate) {
      return res.status(429).send({ error: 'Duplicate scan detected. Please wait before trying again.' });
    }

    if (todayRows.length % 2 === 1 && todayRows[todayRows.length - 1][4] !== 'Attendance Login') {
      return res.status(400).send({ error: 'Logout attempted without a prior login.' });
    }

    let type = 'Attendance Login';
    let serviceTime = '';
    let sessionNumber = Math.floor(todayRows.length / 2) + 1;

    if (todayRows.length % 2 === 1 && todayRows[todayRows.length - 1][4] === 'Attendance Login') {
      type = 'Attendance Logout';
      const loginTimeStr = todayRows[todayRows.length - 1][3];
      const logoutTime = new Date(`${date} ${timestamp}`);
      const loginTime = new Date(`${date} ${loginTimeStr}`);
      const diffMs = logoutTime - loginTime;
      serviceTime = Math.round(diffMs / 60000);
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: 'Daily Attendance Logs!A:G',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[studentId, name, date, timestamp, type, serviceTime, `Session ${sessionNumber}`]]
      }
    });

    // --- Update or Append row in Summary tab ---
    const summaryResp = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: 'Daily Attendance Summary!A2:F'
    });

    const summaryRows = summaryResp.data.values || [];
    const updatedKey = `${studentId}-${date}`;
    const updatedSummary = new Map();

    // Refresh logs after append to get the full, accurate record
    const updatedLogs = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: 'Daily Attendance Logs!A:G'
    });
    rows = updatedLogs.data.values || [];

    for (const row of rows) {
      const [sid, sname, sdate, , , time] = row;
      if (!sid || !sdate || !time) continue;
      const key = `${sid}-${sdate}`;
      const mins = parseInt(time);
      if (!isNaN(mins)) {
        if (!updatedSummary.has(key)) {
          updatedSummary.set(key, { studentId: sid, name: sname, date: sdate, total: 0 });
        }
        updatedSummary.get(key).total += mins;
      }
    }

    const latestSummary = updatedSummary.get(updatedKey);
if (!latestSummary) {
  console.warn('No summary entry found for update. Skipping.');
} else {
  const { studentId: sid, name: sname, date: sdate, total } = latestSummary;

    

      const existingIndex = summaryRows.findIndex(row => row[0] === sid && row[2] === sdate);
  if (existingIndex !== -1) {
    summaryRows[existingIndex] = [sid, sname, sdate, total, '', ''];
  } else {
    summaryRows.push([sid, sname, sdate, total, '', '']);
  }

  summaryRows.sort((a, b) => {
    const dateDiff = new Date(b[2]) - new Date(a[2]); // Newest dates first
    return dateDiff !== 0 ? dateDiff : a[1].localeCompare(b[1]);
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Daily Attendance Summary!A2:F',
    valueInputOption: 'RAW',
    requestBody: {
      values: summaryRows.map(row => {
        const studentId = row[0];
        const date = row[2];
        const studentDayRows = rows.filter(r => r[0] === studentId && r[2] === date);
        const loginCount = studentDayRows.filter(r => r[4] === 'Attendance Login').length;
        const logoutCount = studentDayRows.filter(r => r[4] === 'Attendance Logout').length;
        const completed = loginCount > 0 && loginCount === logoutCount ? '✅' : '❌';
        const lastUpdated = new Date().toLocaleString();
        return [...row.slice(0, 4), completed, lastUpdated];
      })
    }
  });
}

    res.status(200).send({
      message: `✅ ${type} recorded – Session ${sessionNumber}` + (serviceTime ? ` – Service Time: ${serviceTime} min` : ''),
      type,
      session: `Session ${sessionNumber}`,
      serviceTime
    });
  } catch (err) {
    console.error('Error processing scan:', err.message);
    console.error(err.stack);
    res.status(500).send({ error: 'Failed to record attendance' });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
