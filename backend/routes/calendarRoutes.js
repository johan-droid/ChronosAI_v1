const express = require('express');
const router = express.Router();
const { getAuthUrl, handleAuthCallback } = require('../controllers/calendarController');
const { protect } = require('../middleware/authMiddleware');

router.get('/auth-url', protect, getAuthUrl);
router.get('/callback', handleAuthCallback);

module.exports = router;