const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
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
    enum: ['google', 'github'],
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
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);