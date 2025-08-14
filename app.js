// app.js
require('dotenv').config();
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');
const session = require('express-session');
const app = express();

// DB for application use
const db = require('./db/appDb.js');

// Passport setup
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL || 'http://localhost:3000/vitals/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());

app.use(session({ secret: 'your_secret', resave: false, saveUninitialized: true }));
app.use(passport.session());

// Routing
const homeRouter = require('./routes/home')();
const authGoogleRouter = require('./routes/authGoogle')();
const authGoogleCallbackRouter = require('./routes/authGoogleCallback')();
const logoutRouter = require('./routes/logout')();
const dashboardRouter = require('./routes/dashboard')();
const saveRouter = require('./routes/save')(db);
const myVitalsRouter = require('./routes/myVitals')(db);
const chartRouter = require('./routes/chart')(db);
const exportRouter = require('./routes/export')();
const exportDownloadRouter = require('./routes/exportDownload')(db);

app.use('/vitals', homeRouter);
app.use('/vitals', authGoogleRouter);
app.use('/vitals', authGoogleCallbackRouter);
app.use('/vitals', logoutRouter);
app.use('/vitals', dashboardRouter);
app.use('/vitals', saveRouter);
app.use('/vitals', myVitalsRouter);
app.use('/vitals', chartRouter);
app.use('/vitals', exportRouter);
app.use('/vitals', exportDownloadRouter);

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Vitals app running on port ${PORT}`));

