const express = require('express');
const renderPage = require('../views/renderPage');

module.exports = () => {
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
  return router;
};
