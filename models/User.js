// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  githubId: {
    type: String,
    unique: true,
    sparse: true
  },
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
  provider: {
    type: String,
    enum: ['google', 'github', 'email'],
    required: true
  },
  isOnboardingComplete: {
    type: Boolean,
    default: false
  },
  profile: {
    role: {
      type: String,
      enum: ['student', 'employer'],
      required: false
    },
    company: String,
    jobTitle: String,
    skills: [String],
    bio: String,
    location: String,
    preferences: {
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);