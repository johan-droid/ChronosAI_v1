const Meeting = require('../models/Meeting');
const { sendCustomEmail } = require('../integrations/emailService');

const {
    createMeetingRecord,
    rescheduleMeeting,
    cancelMeeting,
    checkAvailability,
    requestWaitingRoomAccess,
    approveWaitingRoomRequest,
    declineWaitingRoomRequest,
    generateJoinToken,
    validateJoinToken
} = require('../meetingManager/scheduleMeeting');

// @desc    Get all meetings for the logged-in user (as organizer or participant)
// @route   GET /api/meetings
// @access  Private
const getMyMeetings = async (req, res) => {
    try {
        const email = req.user.email;
        const meetings = await Meeting.find({
            $or: [
                { organizer: req.user._id },
                { participants: { $in: [email] } }
            ]
        }).sort({ date: 1, startTime: 1 });

        res.status(200).json(meetings);
    } catch (error) {
        console.error("Error fetching meetings:", error);
        res.status(500).json({ message: "Failed to fetch meetings" });
    }
};

// @desc    Schedule a new meeting
// @route   POST /api/meetings
// @access  Private
const scheduleMeetingController = async (req, res) => {
    try {
        const { title, date, time, duration, participants } = req.body;
        if (!date || !time || !duration || !participants || !Array.isArray(participants) || participants.length === 0) {
            return res.status(400).json({ message: 'Please provide date, time, duration, and participants array.' });
        }

        const result = await createMeetingRecord({ title, date, time, duration, participants }, req.user._id, req.user.timezone);

        if (!result.success) {
            return res.status(400).json({ message: result.message, conflict: result.conflict });
        }

        return res.status(201).json({ message: 'Meeting scheduled successfully.', meeting: result.meeting });
    } catch (error) {
        console.error('Error scheduling meeting:', error);
        return res.status(500).json({ message: 'Server error when scheduling meeting.' });
    }
};

// @desc    Check availability for requested slot across participants
// @route   POST /api/meetings/availability
// @access  Private
const checkAvailabilityController = async (req, res) => {
    try {
        const { date, time, duration, participants } = req.body;
        if (!date || !time || !duration || !participants || !Array.isArray(participants)) {
            return res.status(400).json({ message: 'Please provide date, time, duration, and participants array.' });
        }

        const result = await checkAvailability({ date, startTime: time, duration, participants, organizerId: req.user._id });
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error checking availability:', error);
        return res.status(500).json({ message: 'Server error when checking availability.' });
    }
};

// @desc    Request waiting room access
// @route   POST /api/meetings/:id/request-access
// @access  Private
const requestWaitingRoomAccessController = async (req, res) => {
    try {
        const meetingId = req.params.id;
        const userEmail = req.user.email;

        const result = await requestWaitingRoomAccess(meetingId, userEmail);
        if (!result.success) return res.status(400).json({ message: result.message });
        return res.status(200).json({ message: result.message });
    } catch (error) {
        console.error('Error requesting access:', error);
        return res.status(500).json({ message: 'Server error when requesting waiting room access.' });
    }
};

// @desc    Approve waiting room request
// @route   POST /api/meetings/:id/approve-access
// @access  Private
const approveWaitingRoomRequestController = async (req, res) => {
    try {
        const meetingId = req.params.id;
        const { email } = req.body;

        const result = await approveWaitingRoomRequest(meetingId, req.user._id, email);
        if (!result.success) return res.status(400).json({ message: result.message });
        return res.status(200).json({ message: 'Request approved', pendingRequests: result.meeting.pendingRequests });
    } catch (error) {
        console.error('Error approving access:', error);
        return res.status(500).json({ message: 'Server error when approving waiting room request.' });
    }
};

// @desc    Decline waiting room request
// @route   POST /api/meetings/:id/decline-access
// @access  Private
const declineWaitingRoomRequestController = async (req, res) => {
    try {
        const meetingId = req.params.id;
        const { email } = req.body;

        const result = await declineWaitingRoomRequest(meetingId, req.user._id, email);
        if (!result.success) return res.status(400).json({ message: result.message });
        return res.status(200).json({ message: 'Request declined', pendingRequests: result.meeting.pendingRequests });
    } catch (error) {
        console.error('Error declining access:', error);
        return res.status(500).json({ message: 'Server error when declining waiting room request.' });
    }
};

// @desc    List waiting room pending requests
// @route   GET /api/meetings/:id/pending-requests
// @access  Private
const getPendingRequestsController = async (req, res) => {
    try {
        const meetingId = req.params.id;
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

        if (meeting.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only organizer can view pending requests.' });
        }

        return res.status(200).json({ pendingRequests: meeting.pendingRequests });
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        return res.status(500).json({ message: 'Server error when fetching pending requests.' });
    }
};

// @desc    Generate join token
// @route   GET /api/meetings/:id/join-token
// @access  Private
const getJoinTokenController = async (req, res) => {
    try {
        const meetingId = req.params.id;
        const userEmail = req.user.email;

        const result = await generateJoinToken(meetingId, userEmail);
        if (!result.success) return res.status(403).json({ message: result.message });

        return res.status(200).json({ token: result.token, expiresAt: result.expiresAt });
    } catch (error) {
        console.error('Error creating join token:', error);
        return res.status(500).json({ message: 'Server error when creating join token.' });
    }
};

// @desc    Validate join token
// @route   POST /api/meetings/:id/validate-token
// @access  Private
const validateJoinTokenController = async (req, res) => {
    try {
        const meetingId = req.params.id;
        const { token } = req.body;

        const result = await validateJoinToken(meetingId, token);
        if (!result.valid) return res.status(403).json({ message: result.message });

        return res.status(200).json({ valid: true, email: result.email });
    } catch (error) {
        console.error('Error validating join token:', error);
        return res.status(500).json({ message: 'Server error when validating join token.' });
    }
};

// @desc    Send a custom email through Resend (API/SMTP path)
// @route   POST /api/meetings/custom-email
// @access  Private
const sendCustomEmailController = async (req, res) => {
    try {
        const { to, cc = [], subject, html, template } = req.body;

        if (!to || !subject || !(html || template)) {
            return res.status(400).json({ message: 'Please provide to, subject, and either html or template payload.' });
        }

        const customData = template || {
            heading: 'Custom Notification',
            message: html,
            actionText: 'Open app',
            actionUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
            footer: 'Sent from ChronosAI'
        };

        // use html directly if provided, otherwise apply email template
        const success = await sendCustomEmail({
            meetingId: null,
            to,
            cc,
            subject,
            customHtml: html || undefined,
            customData,
            eventType: 'custom_email'
        });

        if (!success) {
            return res.status(500).json({ message: 'Custom email failed to send.' });
        }

        return res.status(200).json({ message: 'Custom email sent.' });
    } catch (error) {
        console.error('Error sending custom email:', error);
        return res.status(500).json({ message: 'Server error when sending custom email.' });
    }
};

// @desc    Reschedule a meeting
// @route   POST /api/meetings/:id/reschedule
// @access  Private
const rescheduleMeetingController = async (req, res) => {
    try {
        const meetingId = req.params.id;
        const { date, time, duration } = req.body;

        if (!date && !time && !duration) {
            return res.status(400).json({ message: 'Please provide date, time, or duration to reschedule.' });
        }

        const result = await rescheduleMeeting(meetingId, req.user._id, { date, time, duration });

        if (!result.success) {
            return res.status(400).json({ message: result.message });
        }

        res.status(200).json({ message: 'Meeting rescheduled successfully.', meeting: result.meeting });
    } catch (error) {
        console.error('Error in rescheduleMeetingController:', error);
        res.status(500).json({ message: 'Server error when rescheduling meeting.' });
    }
};

// @desc    Cancel a meeting
// @route   POST /api/meetings/:id/cancel
// @access  Private
const cancelMeetingController = async (req, res) => {
    try {
        const meetingId = req.params.id;

        const result = await cancelMeeting(meetingId, req.user._id);

        if (!result.success) {
            return res.status(400).json({ message: result.message });
        }

        res.status(200).json({ message: 'Meeting cancelled successfully.', meeting: result.meeting });
    } catch (error) {
        console.error('Error in cancelMeetingController:', error);
        res.status(500).json({ message: 'Server error when cancelling meeting.' });
    }
};

module.exports = {
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
};
