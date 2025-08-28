// api/index.js - Basic Vercel serverless function with MongoDB
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

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
  // Don't intercept static file requests
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    return res.status(404).send('File not found');
  }
  
  // Serve index.html for all other routes
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;