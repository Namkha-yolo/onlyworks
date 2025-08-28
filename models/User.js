// models/User.js - User schema for MongoDB
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['student', 'employer'],
    default: null
  },
  profile: {
    company: { type: String, default: '' },
    jobTitle: { type: String, default: '' },
    location: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: { type: [String], default: [] },
    university: { type: String, default: '' },
    major: { type: String, default: '' },
    graduationYear: { type: Number, default: null }
  },
  isOnboardingComplete: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);