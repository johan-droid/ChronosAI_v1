const Meeting = require('../models/Meeting');

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

module.exports = { getMyMeetings };
