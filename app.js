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
const vitalsRouter = require('./routes/vitals')(db);
app.use('/vitals', vitalsRouter);

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Vitals app running on port ${PORT}`));

