You can start the app with `npm start`.
=======
# Vital Vitals

A small Node.js application for recording blood pressure and other health metrics. It allows you to sign in with Google, log your vitals and export them as CSV for your doctor.

## Installation

1. Clone the repository
   ```bash
   git clone <repo-url>
   cd vitalVitals
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Copy the example environment file and fill in your credentials
   ```bash
   cp .env.example .env
   ```
4. Ensure a MySQL database is available and the credentials in `.env` match.
5. Start the server
   ```bash
   node app.js
   ```

## Environment Variables

The application relies on several environment variables. They can be configured in the `.env` file:

- `DB_HOST` – Database host
- `DB_PORT` – Database port (default: 3306)
- `DB_USER` – Database user
- `DB_PASS` – Database password
- `DB_NAME` – Database name
- `GOOGLE_CLIENT_ID` – Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` – Google OAuth client secret
- `CALLBACK_URL` – Google OAuth callback URL (e.g. `http://localhost:3000/vitals/auth/google/callback`)
- `SESSION_SECRET` – Secret string used to sign the session cookie
- `PORT` – Port for the Express server (default: 3000)

## Usage

1. Open your browser to `http://localhost:3000/vitals`.
2. Sign in with Google when prompted.
3. Add new vitals in the dashboard and review or export them from the history page.

The app is intentionally simple and meant as a personal health tracker that can export your records in CSV format.
