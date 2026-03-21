const express = require('express');
const router = express.Router();
const { getMyMeetings, rescheduleMeetingController, cancelMeetingController } = require('../controllers/meetingController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMyMeetings);
router.post('/:id/reschedule', protect, rescheduleMeetingController);
router.post('/:id/cancel', protect, cancelMeetingController);

module.exports = router;
