const express = require('express');
const passport = require('passport');
const router = express.Router();

// Google OAuth
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Check if user needs onboarding
    if (!req.user.isOnboardingComplete) {
      res.redirect('/onboarding.html');
    } else {
      res.redirect('/dashboard.html');
    }
  }
);

// GitHub OAuth (optional)
router.get('/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    if (!req.user.isOnboardingComplete) {
      res.redirect('/onboarding.html');
    } else {
      res.redirect('/dashboard.html');
    }
  }
);

// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

module.exports = router;