// server.js - Main application server with OAuth
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');
const cors = require('cors');

// Load environment variables
require('dotenv').config();

// Import User model
const User = require('./models/User');

const app = express();

// ============================================
// DATABASE CONNECTION
// ============================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ============================================
// MIDDLEWARE SETUP
// ============================================

// CORS configuration
app.use(cors({
  origin: process.env.DOMAIN || 'http://localhost:3000',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration - CRITICAL: Must be before passport
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60 // 24 hours in seconds
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  }
}));

// Initialize Passport - MUST be after session middleware
app.use(passport.initialize());
app.use(passport.session());

// ============================================
// PASSPORT OAUTH CONFIGURATION
// ============================================

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.DOMAIN}/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔐 Google OAuth callback for:', profile.displayName);
    
    // Check if user already exists with Google ID
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      console.log('✅ Existing user found:', user.email);
      return done(null, user);
    }
    
    // Check if user exists with same email (linking accounts)
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      console.log('🔗 Linking Google account to existing user');
      user.googleId = profile.id;
      await user.save();
      return done(null, user);
    }
    
    // Create new user
    user = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      avatar: profile.photos[0].value,
      provider: 'google'
    });
    
    await user.save();
    console.log('✅ New user created:', user.email);
    return done(null, user);
    
  } catch (error) {
    console.error('❌ OAuth error:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

// Check if user is logged in
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // If API route, return JSON error
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // Otherwise redirect to home page
  res.redirect('/?error=auth_required');
};

// Check if onboarding is complete
const requireOnboarding = (req, res, next) => {
  if (req.user && !req.user.isOnboardingComplete) {
    return res.redirect('/onboarding.html');
  }
  next();
};

// ============================================
// OAUTH ROUTES
// ============================================

// Start Google OAuth flow
app.get('/auth/google', (req, res, next) => {
  console.log('🚀 Starting Google OAuth...');
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account' // Always show account selector
  })(req, res, next);
});

// Google OAuth callback
app.get('/auth/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/?error=oauth_failed' 
  }), 
  (req, res) => {
    console.log('✅ OAuth successful for:', req.user.email);
    
    // Redirect based on onboarding status
    if (!req.user.isOnboardingComplete) {
      res.redirect('/onboarding.html');
    } else {
      res.redirect('/dashboard.html');
    }
  }
);

// Logout
app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('❌ Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    console.log('👋 User logged out');
    res.redirect('/');
  });
});

// ============================================
// API ROUTES
// ============================================

// Get current user info
app.get('/api/user', isAuthenticated, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      isOnboardingComplete: req.user.isOnboardingComplete,
      profile: req.user.profile,
      settings: req.user.settings
    }
  });
});

// Update user profile (onboarding)
app.post('/api/user/profile', isAuthenticated, async (req, res) => {
  try {
    const { role, company, jobTitle, bio, skills, location } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'profile.role': role,
          'profile.company': company,
          'profile.jobTitle': jobTitle,
          'profile.bio': bio,
          'profile.skills': skills || [],
          'profile.location': location,
          isOnboardingComplete: true
        }
      },
      { new: true }
    );
    
    console.log('✅ Profile updated for:', updatedUser.email);
    res.json({ success: true, user: updatedUser });
    
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PAGE ROUTES (Protected HTML Pages)
// ============================================

// Dashboard - requires login and onboarding
app.get('/dashboard.html', isAuthenticated, requireOnboarding, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Onboarding - requires login only
app.get('/onboarding.html', isAuthenticated, (req, res) => {
  // If already onboarded, redirect to dashboard
  if (req.user.isOnboardingComplete) {
    return res.redirect('/dashboard.html');
  }
  res.sendFile(path.join(__dirname, 'public', 'onboarding.html'));
});

// Profile page - requires login and onboarding
app.get('/profile.html', isAuthenticated, requireOnboarding, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${process.env.DOMAIN || `http://localhost:${PORT}`}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 OAuth configured: ${!!process.env.GOOGLE_CLIENT_ID}`);
});