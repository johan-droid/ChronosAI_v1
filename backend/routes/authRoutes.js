const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    getGoogleAuthUrl,
    handleGoogleCallback,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // Import the bouncer

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/google-url', getGoogleAuthUrl);
router.get('/google/callback', handleGoogleCallback);

// Notice how we pass 'protect' as the second argument before 'getMe'
router.get('/me', protect, getMe);

module.exports = router;