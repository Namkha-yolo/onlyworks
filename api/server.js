// server.js - Complete Vercel-compatible version with JWT authentication
require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());
app.use(passport.initialize());

// JWT secret - make sure to set this in your .env file
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-this-in-production';

// Debug logging for development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
      hasToken: !!req.cookies?.authToken,
      userAgent: req.get('User-Agent')?.substring(0, 50)
    });
    next();
  });
}

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.NODE_ENV === 'production' 
    ? `${process.env.VERCEL_URL || 'https://your-app.vercel.app'}/auth/google/callback`
    : "/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  console.log('Google OAuth success for:', profile.displayName);
  
  const user = {
    id: profile.id,
    name: profile.displayName,
    email: profile.emails?.[0]?.value || '',
    avatar: profile.photos?.[0]?.value || '',
    isOnboardingComplete: false,
    profile: null,
    createdAt: new Date().toISOString()
  };
  
  return done(null, user);
}));

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.cookies?.authToken || 
                req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    console.log('No token found in request');
    return res.status(401).json({ 
      success: false, 
      error: 'Not authenticated' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log('Token verified for user:', decoded.name);
    next();
  } catch (error) {
    console.log('Token verification failed:', error.message);
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
  (req, res) => {
    if (!req.user) {
      console.log('OAuth callback: No user found');
      return res.redirect('/?error=oauth_failed');
    }
    
    console.log('OAuth callback success for:', req.user.name);
    
    try {
      // Create JWT token
      const token = jwt.sign(req.user, JWT_SECRET, { expiresIn: '24h' });
      
      // Set secure cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : 'localhost'
      });
      
      // Redirect based on onboarding status
      if (!req.user.isOnboardingComplete) {
        console.log('Redirecting to onboarding');
        res.redirect('/onboarding.html');
      } else {
        console.log('Redirecting to dashboard');
        res.redirect('/dashboard.html');
      }
    } catch (error) {
      console.error('Token creation error:', error);
      res.redirect('/?error=token_creation_failed');
    }
  }
);

// API Routes
app.get('/api/user', authenticateToken, (req, res) => {
  console.log('Returning user data for:', req.user.name);
  res.json({
    success: true,
    user: req.user
  });
});

app.post('/api/user/profile', authenticateToken, (req, res) => {
  const profileData = req.body;
  console.log('Profile update for:', req.user.name, profileData);
  
  // Validate required fields
  if (!profileData.role) {
    return res.status(400).json({
      success: false,
      error: 'Role is required'
    });
  }
  
  // Validate role values
  if (!['student', 'employer'].includes(profileData.role)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid role. Must be student or employer'
    });
  }
  
  // Update user data
  const updatedUser = {
    ...req.user,
    profile: {
      role: profileData.role,
      company: profileData.company || '',
      jobTitle: profileData.jobTitle || '',
      location: profileData.location || '',
      bio: profileData.bio || '',
      skills: Array.isArray(profileData.skills) ? profileData.skills : []
    },
    isOnboardingComplete: true,
    updatedAt: new Date().toISOString()
  };
  
  try {
    // Create new token with updated data
    const newToken = jwt.sign(updatedUser, JWT_SECRET, { expiresIn: '24h' });
    
    // Update cookie
    res.cookie('authToken', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : 'localhost'
    });
    
    console.log('Profile updated successfully for:', updatedUser.name);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
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
  console.log('Logout requested');
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : 'localhost'
  });
  res.redirect('/');
});

// Debug routes (remove in production)
if (process.env.NODE_ENV !== 'production') {
  app.get('/debug/session', authenticateToken, (req, res) => {
    res.json({
      authenticated: true,
      user: {
        name: req.user.name,
        email: req.user.email,
        isOnboardingComplete: req.user.isOnboardingComplete,
        profile: req.user.profile
      }
    });
  });
  
  app.get('/debug/token', (req, res) => {
    const token = req.cookies?.authToken;
    if (!token) {
      return res.json({ hasToken: false });
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json({ 
        hasToken: true, 
        valid: true, 
        user: decoded.name,
        exp: new Date(decoded.exp * 1000)
      });
    } catch (error) {
      res.json({ 
        hasToken: true, 
        valid: false, 
        error: error.message 
      });
    }
  });
}

// Health check route for Vercel
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
});

// Catch-all route - serve index.html for client-side routing

// Catch-all route - serve index.html for client-side routing
app.get('*', (req, res) => {
  // Don't intercept requests for static files
  if (req.path.includes('.')) {
    return res.status(404).send('File not found');
  }
  
  try {
    // Use path.resolve instead of __dirname for Vercel compatibility
    res.sendFile(path.resolve('./public/index.html'));
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Internal Server Error');
  }
});
module.exports = app;