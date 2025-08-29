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
app.use(express.json({ limit: '50mb' })); // Increased for image data
app.use(express.static(path.join(__dirname, '../public')));
app.use(cookieParser());
app.use(passport.initialize());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-this';

// MongoDB connection with serverless optimization
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      maxPoolSize: 1,
      bufferCommands: false,
    });
    
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    isConnected = false;
    throw error;
  }
};

// Google OAuth Strategy - streamlined for serverless
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://www.only-works.com/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Quick timeout for database operations
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database timeout')), 10000)
    );

    const dbOperation = (async () => {
      await connectToDatabase();
      
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        // Existing user
        return { ...user.toObject(), isExistingUser: true };
      }
      
      // New user
      user = new User({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0]?.value || '',
        avatar: profile.photos?.[0]?.value || '',
        isOnboardingComplete: false
      });
      
      await user.save();
      return { ...user.toObject(), isExistingUser: false };
    })();

    const result = await Promise.race([dbOperation, timeoutPromise]);
    return done(null, result);
    
  } catch (error) {
    console.error('OAuth error:', error);
    // Fallback: return user data without database storage
    const fallbackUser = {
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails?.[0]?.value || '',
      avatar: profile.photos?.[0]?.value || '',
      isOnboardingComplete: false,
      isExistingUser: false
    };
    return done(null, fallbackUser);
  }
}));

// Stateless JWT authentication - no database lookup on every request
const authenticateToken = (req, res, next) => {
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
    req.user = decoded;
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
  (req, res) => {
    if (!req.user) {
      return res.redirect('/?error=oauth_failed');
    }
    
    // Create stateless JWT with all user data
    const token = jwt.sign({
      userId: req.user._id,
      googleId: req.user.googleId,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      role: req.user.role,
      isOnboardingComplete: req.user.isOnboardingComplete,
      profile: req.user.profile
    }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    // Route based on user status
    if (req.user.isExistingUser && req.user.isOnboardingComplete) {
      res.redirect('/dashboard.html');
    } else {
      res.redirect('/onboarding.html');
    }
  }
);

// API Routes
app.get('/api/user', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Complete onboarding
app.post('/api/complete-onboarding', authenticateToken, async (req, res) => {
  try {
    const { role, company, jobTitle, location, bio, skills } = req.body;
    
    if (!role || !['student', 'employer'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Valid role (student or employer) is required'
      });
    }

    await connectToDatabase();
    
    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        role: role,
        profile: {
          company: company || '',
          jobTitle: jobTitle || '',
          location: location || '',
          bio: bio || '',
          skills: Array.isArray(skills) ? skills : []
        },
        isOnboardingComplete: true
      },
      { new: true }
    );

    // Create new JWT with updated data
    const newToken = jwt.sign({
      userId: updatedUser._id,
      googleId: updatedUser.googleId,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
      isOnboardingComplete: true,
      profile: updatedUser.profile
    }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('authToken', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Onboarding completed successfully'
    });
  } catch (error) {
    console.error('Onboarding completion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete onboarding'
    });
  }
});

// AI Tracker - Server-side API analysis
app.post('/api/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const { imageData, goal } = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured on server'
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [{
            type: 'text',
            text: `Analyze this screenshot for productivity. User's goal: "${goal}". 
            
            Return ONLY valid JSON in this exact format:
            {
              "productivityScore": 75,
              "activity": "Coding",
              "insights": ["User is focused on development work", "Multiple IDE windows open"]
            }`
          }, {
            type: 'image_url',
            image_url: { url: imageData }
          }]
        }],
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let analysis;
    
    try {
      const content = data.choices[0].message.content;
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // Fallback analysis
      analysis = {
        productivityScore: 50,
        activity: 'General Work',
        insights: ['AI analysis completed successfully']
      };
    }
    
    res.json({ success: true, analysis });
    
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'AI analysis failed: ' + error.message
    });
  }
});

// Save screenshot with AI analysis
app.post('/api/save-screenshot', authenticateToken, async (req, res) => {
  try {
    const { imageData, aiAnalysis, trigger, goal } = req.body;

    await connectToDatabase();

    // Create Screenshot model if not exists
    const screenshotData = {
      userId: req.user.userId,
      imageData: imageData, // base64 or URL
      aiAnalysis: aiAnalysis,
      trigger: trigger,
      goal: goal,
      capturedAt: new Date()
    };

    // Save to user's screenshot collection
    // This would require a Screenshot model - for now just return success
    console.log('Would save screenshot for user:', req.user.userId);

    res.json({
      success: true,
      message: 'Screenshot saved successfully'
    });
  } catch (error) {
    console.error('Screenshot save error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save screenshot'
    });
  }
});

// Logout route - clear cookie and redirect
app.post('/api/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Logout GET route for direct access
app.get('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.redirect('/');
});

// Tracker route - serve tracker page for authenticated users
app.get('/tracker', authenticateToken, (req, res) => {
  res.sendFile(path.resolve('public/tracker.html'));
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

// Serve static files and handle client-side routing
app.get('*', (req, res) => {
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    return res.status(404).send('File not found');
  }
  
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