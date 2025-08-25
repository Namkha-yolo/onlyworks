const express = require('express');
const User = require('../models/User');
const { isAuthenticated, isOnboardingComplete } = require('../middleware/auth');
const router = express.Router();

// Get user profile data
router.get('/api/user', isAuthenticated, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      profile: req.user.profile
    }
  });
});

// Update user profile
router.post('/api/user/profile', isAuthenticated, async (req, res) => {
  try {
    const { company, jobTitle, industry, experience, preferences } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'profile.company': company,
          'profile.jobTitle': jobTitle,
          'profile.industry': industry,
          'profile.experience': experience,
          'profile.preferences': preferences,
          isOnboardingComplete: true
        }
      },
      { new: true }
    );
    
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;