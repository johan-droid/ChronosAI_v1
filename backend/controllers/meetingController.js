const Meeting = require('../models/Meeting');

const { rescheduleMeeting, cancelMeeting } = require('../meetingManager/scheduleMeeting');

// @desc    Get all meetings for the logged-in user
// @route   GET /api/meetings
// @access  Private
const getMyMeetings = async (req, res) => {
    try {
        // Find meetings where the user is the organizer
        const meetings = await Meeting.find({ organizer: req.user._id }).sort({ date: 1, startTime: 1 });
        res.status(200).json(meetings);
    } catch (error) {
        console.error("Error fetching meetings:", error);
        res.status(500).json({ message: "Failed to fetch meetings" });
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

module.exports = { getMyMeetings, rescheduleMeetingController, cancelMeetingController };
