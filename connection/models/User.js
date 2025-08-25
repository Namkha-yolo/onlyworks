// models/User.js - User database schema
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // OAuth provider IDs
  googleId: {
    type: String,
    unique: true,
    sparse: true  // Allows null values to be non-unique
  },
  
  // Basic user info from OAuth
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  
  // Which OAuth provider they used
  provider: {
    type: String,
    enum: ['google', 'github'],
    required: true
  },
  
  // Onboarding status
  isOnboardingComplete: {
    type: Boolean,
    default: false
  },
  
  // Additional profile data (collected during onboarding)
  profile: {
    role: {
      type: String,
      enum: ['student', 'employer'],
      default: null
    },
    company: {
      type: String,
      default: ''
    },
    jobTitle: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    skills: [{
      type: String
    }],
    location: {
      type: String,
      default: ''
    }
  },
  
  // User preferences
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    privacy: {
      type: String,
      enum: ['public', 'private'],
      default: 'private'
    }
  }
}, {
  timestamps: true  // Adds createdAt and updatedAt fields
});

// Export the model
module.exports = mongoose.model('User', userSchema);