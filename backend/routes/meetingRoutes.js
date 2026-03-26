const express = require('express');
const router = express.Router();
const {
    getMyMeetings,
    scheduleMeetingController,
    checkAvailabilityController,
    requestWaitingRoomAccessController,
    approveWaitingRoomRequestController,
    declineWaitingRoomRequestController,
    getPendingRequestsController,
    getJoinTokenController,
    validateJoinTokenController,
    rescheduleMeetingController,
    cancelMeetingController,
    sendCustomEmailController
} = require('../controllers/meetingController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMyMeetings);
router.post('/', protect, scheduleMeetingController);
router.post('/availability', protect, checkAvailabilityController);
router.post('/custom-email', protect, sendCustomEmailController);
router.post('/:id/request-access', protect, requestWaitingRoomAccessController);
router.post('/:id/approve-access', protect, approveWaitingRoomRequestController);
router.post('/:id/decline-access', protect, declineWaitingRoomRequestController);
router.get('/:id/pending-requests', protect, getPendingRequestsController);
router.get('/:id/join-token', protect, getJoinTokenController);
router.post('/:id/validate-token', protect, validateJoinTokenController);
router.post('/:id/reschedule', protect, rescheduleMeetingController);
router.post('/:id/cancel', protect, cancelMeetingController);

module.exports = router;
