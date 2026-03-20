const express = require('express');
const router = express.Router();
const { processChatMessage } = require('../controllers/dialogueController');
const { protect } = require('../middleware/authMiddleware');

// Protect this route! We must know who is chatting to track their specific session.
router.post('/', protect, processChatMessage);

module.exports = router;