// api/index.js - Vercel serverless function with Google OAuth and AI Tracker
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');

// Import User model
const User = require('../models/User');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(cookieParser());
app.use(passport.initialize());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-this';

// MongoDB connection
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    await connectToDatabase();
    
    console.log('Google OAuth success for:', profile.displayName);
    
    // Check if user already exists
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      console.log('Existing user found:', user.name);
      return done(null, user);
    }
    
    // Create new user
    user = new User({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails?.[0]?.value || '',
      avatar: profile.photos?.[0]?.value || ''
    });
    
    await user.save();
    console.log('New user created:', user.name);
    
    return done(null, user);
  } catch (error) {
    console.error('OAuth error:', error);
    return done(error, null);
  }
}));

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const token = req.cookies?.authToken || 
                req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Not authenticated' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get fresh user data from database
    await connectToDatabase();
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
};

// Auth Routes
app.get('/auth/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  session: false
}));

app.get('/auth/google/callback', 
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/?error=oauth_failed'
  }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect('/?error=oauth_failed');
      }
      
      // Create JWT token
      const token = jwt.sign(
        { userId: req.user._id }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
      );
      
      // Set secure cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // Redirect based on onboarding status
      if (!req.user.isOnboardingComplete) {
        res.redirect('/onboarding.html');
      } else {
        res.redirect('/dashboard.html');
      }
    } catch (error) {
      console.error('Callback error:', error);
      res.redirect('/?error=token_creation_failed');
    }
  }
);

// API Routes
app.get('/api/user', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      role: req.user.role,
      profile: req.user.profile,
      isOnboardingComplete: req.user.isOnboardingComplete
    }
  });
});

// Update user profile
app.post('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { role, company, jobTitle, location, bio, skills, university, major, graduationYear } = req.body;
    
    // Validate required fields
    if (!role || !['student', 'employer'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Valid role (student or employer) is required'
      });
    }
    
    // Update user
    req.user.role = role;
    req.user.profile = {
      company: company || '',
      jobTitle: jobTitle || '',
      location: location || '',
      bio: bio || '',
      skills: Array.isArray(skills) ? skills : [],
      university: university || '',
      major: major || '',
      graduationYear: graduationYear || null
    };
    req.user.isOnboardingComplete = true;
    
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        role: req.user.role,
        profile: req.user.profile,
        isOnboardingComplete: req.user.isOnboardingComplete
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Logout route
app.get('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.redirect('/');
});

// Tracker route - serve tracker page for authenticated users
app.get('/tracker', authenticateToken, (req, res) => {
  res.sendFile(path.resolve('public/tracker.html'));
});

// API endpoint for AI analysis (if you want server-side processing)
app.post('/api/analyze-screenshot', authenticateToken, async (req, res) => {
  try {
    const { base64Image, goal } = req.body;
    
    // You could add server-side OpenAI processing here
    // For now, let client handle it directly
    
    res.json({
      success: true,
      message: 'Analysis endpoint available'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Analysis failed'
    });
  }
});

// Health check with database status
app.get('/api/health', async (req, res) => {
  try {
    await connectToDatabase();
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'Server and database are running',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working',
    path: req.path,
    method: req.method
  });
});

// Serve static files and handle client-side routing
app.get('*', (req, res) => {
  // Don't intercept requests for static files
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    return res.status(404).send('File not found');
  }
  
  // Serve index.html for all other routes
  try {
    res.sendFile(path.resolve('public/index.html'));
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Internal Server Error');
  }
});

const port = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log('Environment:', process.env.NODE_ENV || 'development');
  });
}

module.exports = app;