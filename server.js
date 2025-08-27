// server.js
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');

const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.static('public')); // Serve static files from public directory

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  // Handle user data - add custom properties
  console.log('Google OAuth profile received:', profile.displayName);
  profile.isOnboardingComplete = false;
  profile.profile = null;
  profile.createdAt = new Date();
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.displayName);
  done(null, user);
});

passport.deserializeUser((user, done) => {
  console.log('Deserializing user:', user ? user.displayName : 'None');
  done(null, user);
});

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    authenticated: !!req.user,
    sessionID: req.sessionID,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Auth Routes
app.get('/auth/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

// Single callback route with debugging
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/?error=oauth_failed' }),
  (req, res) => {
    console.log('OAuth callback - User:', req.user ? req.user.displayName : 'None');
    console.log('OAuth callback - Session ID:', req.sessionID);
    console.log('OAuth callback - isOnboardingComplete:', req.user ? req.user.isOnboardingComplete : 'N/A');
    
    if (req.user && !req.user.isOnboardingComplete) {
      console.log('Redirecting to onboarding...');
      res.redirect('/onboarding.html');
    } else {
      console.log('Redirecting to dashboard...');
      res.redirect('/dashboard.html');
    }
  }
);

// API Routes
app.get('/api/user', (req, res) => {
  console.log('API /user called - authenticated:', !!req.user);
  console.log('API /user - session ID:', req.sessionID);
  
  if (req.user) {
    const userData = {
      success: true,
      user: {
        id: req.user.id,
        name: req.user.displayName,
        email: req.user.emails?.[0]?.value,
        avatar: req.user.photos?.[0]?.value,
        isOnboardingComplete: req.user.isOnboardingComplete || false,
        profile: req.user.profile || null,
        createdAt: req.user.createdAt || new Date()
      }
    };
    console.log('Returning user data:', userData.user.name);
    res.json(userData);
  } else {
    console.log('User not authenticated, returning 401');
    res.status(401).json({ 
      success: false,
      error: 'Not authenticated' 
    });
  }
});

app.post('/api/user/profile', (req, res) => {
  console.log('Profile update requested - authenticated:', !!req.user);
  
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      error: 'Not authenticated' 
    });
  }

  const profileData = req.body;
  console.log('Profile data received:', profileData);
  
  // Validate required fields
  if (!profileData.role) {
    return res.status(400).json({
      success: false,
      error: 'Role is required'
    });
  }

  // Update the session user
  req.user.profile = profileData;
  req.user.isOnboardingComplete = true;
  
  console.log('Profile updated for user:', req.user.displayName);
  
  res.json({ 
    success: true, 
    message: 'Profile updated successfully',
    user: {
      id: req.user.id,
      name: req.user.displayName,
      email: req.user.emails?.[0]?.value,
      avatar: req.user.photos?.[0]?.value,
      isOnboardingComplete: req.user.isOnboardingComplete,
      profile: req.user.profile,
      createdAt: req.user.createdAt
    }
  });
});

// Logout route
app.get('/logout', (req, res) => {
  console.log('Logout requested for user:', req.user ? req.user.displayName : 'None');
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ success: false, error: 'Logout failed' });
    }
    res.redirect('/');
  });
});

// Debug route
app.get('/debug/session', (req, res) => {
  res.json({
    authenticated: !!req.user,
    user: req.user ? {
      id: req.user.id,
      name: req.user.displayName,
      isOnboardingComplete: req.user.isOnboardingComplete
    } : null,
    sessionID: req.sessionID
  });
});

// Catch-all route for serving index.html on unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});