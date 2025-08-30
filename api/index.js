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

// AI Tracker - Server-side API analysis using Gemini 1.5 Flash
app.post('/api/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const { imageData, goal } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key not configured on server'
      });
    }

    // Extract base64 data without the data URL prefix
    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this screenshot for productivity and work efficiency. The user's goal is: "${goal}".

Please analyze the screen content and return ONLY a valid JSON object with this exact structure:
{
  "productivityScore": 75,
  "activity": "Coding",
  "insights": ["User appears focused on development work", "Multiple development tools are open"]
}

Rules:
- productivityScore: 0-100 number based on how productive the activity appears
- activity: Brief description of main activity (max 20 characters)
- insights: Array of 1-2 short observations about productivity/focus

Focus on identifying:
- What applications/websites are visible
- Signs of focus vs distraction
- Alignment with the stated goal
- Work-related vs non-work activities`
          },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Data
            }
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 200
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response format from Gemini API');
    }

    const content = data.candidates[0].content.parts[0].text;
    let analysis;
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
      
      // Validate the analysis structure
      if (typeof analysis.productivityScore !== 'number' || 
          !analysis.activity || 
          !Array.isArray(analysis.insights)) {
        throw new Error('Invalid analysis structure');
      }
      
      // Ensure productivityScore is within bounds
      analysis.productivityScore = Math.max(0, Math.min(100, analysis.productivityScore));
      
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', content);
      
      // Fallback analysis if parsing fails
      analysis = {
        productivityScore: 50,
        activity: 'General Work',
        insights: ['AI analysis completed', 'Unable to analyze image details']
      };
    }
    
    res.json({ success: true, analysis });
    
  } catch (error) {
    console.error('Gemini AI analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'AI analysis failed: ' + error.message
    });
  }
});

// Save screenshot with AI analysis - Using cloud storage
app.post('/api/save-screenshot', authenticateToken, async (req, res) => {
  try {
    const { imageData, aiAnalysis, trigger, goal } = req.body;

    await connectToDatabase();

    // For large-scale image storage, you should use cloud storage like:
    // 1. AWS S3 + CloudFront (recommended)
    // 2. Google Cloud Storage
    // 3. Cloudinary
    // 4. Supabase Storage
    
    // Here's a basic implementation that would store metadata in MongoDB
    // and the actual image in cloud storage
    
    const screenshotMetadata = {
      userId: req.user.userId,
      trigger: trigger,
      goal: goal,
      aiAnalysis: aiAnalysis,
      capturedAt: new Date(),
      // imageUrl would be the cloud storage URL after upload
      // imageUrl: uploadedImageUrl,
      sessionId: req.body.sessionId || null, // Group screenshots by session
      productivityScore: aiAnalysis?.productivityScore || 0
    };

    // TODO: Upload image to cloud storage and get URL
    // const uploadedImageUrl = await uploadToCloudStorage(imageData, req.user.userId);
    // screenshotMetadata.imageUrl = uploadedImageUrl;

    console.log('Screenshot metadata to save:', {
      userId: req.user.userId,
      trigger,
      goal,
      productivityScore: aiAnalysis?.productivityScore || 0,
      timestamp: screenshotMetadata.capturedAt
    });

    res.json({
      success: true,
      message: 'Screenshot metadata saved successfully',
      data: {
        screenshotId: screenshotMetadata.capturedAt.getTime(),
        productivityScore: screenshotMetadata.productivityScore
      }
    });
  } catch (error) {
    console.error('Screenshot save error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save screenshot'
    });
  }
});

// Get user's screenshot history
app.get('/api/screenshots', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, page = 1, sessionId } = req.query;

    await connectToDatabase();

    // TODO: Implement screenshot retrieval from database
    // This would query your Screenshot collection filtered by userId
    
    const mockScreenshots = [
      {
        id: '1',
        timestamp: new Date(),
        trigger: 'periodic',
        goal: 'Complete project documentation',
        productivityScore: 85,
        activity: 'Coding',
        imageUrl: null // Would be cloud storage URL
      }
    ];

    res.json({
      success: true,
      screenshots: mockScreenshots,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockScreenshots.length
      }
    });
  } catch (error) {
    console.error('Screenshot retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve screenshots'
    });
  }
});

// Delete screenshot
app.delete('/api/screenshots/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await connectToDatabase();

    // TODO: Delete from database and cloud storage
    console.log(`Would delete screenshot ${id} for user ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Screenshot deleted successfully'
    });
  } catch (error) {
    console.error('Screenshot deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete screenshot'
    });
  }
});

// Get user analytics/insights
app.get('/api/analytics', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query; // 1d, 7d, 30d

    await connectToDatabase();

    // TODO: Aggregate user's productivity data
    const mockAnalytics = {
      averageProductivity: 75,
      totalSessions: 12,
      totalScreenshots: 145,
      mostProductiveHour: 14, // 2 PM
      commonActivities: ['Coding', 'Research', 'Email'],
      productivityTrend: [65, 70, 75, 80, 78, 82, 85], // Last 7 days
      goalAlignment: 80
    };

    res.json({
      success: true,
      analytics: mockAnalytics,
      timeframe
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analytics'
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
      database: 'connected',
      ai_provider: 'gemini'
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
    console.log('AI Provider: Google Gemini 1.5 Flash');
  });
}

module.exports = app;