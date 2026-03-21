const express = require('express');
const router = express.Router();
const { getMyMeetings } = require('../controllers/meetingController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMyMeetings);

module.exports = router;
