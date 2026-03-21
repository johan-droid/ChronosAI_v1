const Meeting = require('../models/Meeting');
const User = require('../models/User'); // Added User model
const { sendMeetingInvite } = require('../integrations/emailService');
const { createGoogleCalendarEvent } = require('../integrations/calendarService'); // Added Google Service

// @desc    Creates a new meeting in the database and pushes to integrations
const createMeetingRecord = async (meetingData, userId, userTimezone) => {
    try {
        // 1. Conflict Check (Internal DB)
        const conflict = await Meeting.findOne({
            organizer: userId,
            date: meetingData.date,
            startTime: meetingData.time,
            status: 'scheduled'
        });

        if (conflict) {
            return { success: false, message: "You already have a meeting scheduled at this time." };
        }

        // 2. Fetch the user to get their Google OAuth tokens
        const user = await User.findById(userId).select('+oauth.refresh_token');

        // 3. Save to database
        const newMeeting = await Meeting.create({
            title: `Meeting with ${meetingData.participants.join(', ')}`,
            date: meetingData.date,
            startTime: meetingData.time,
            duration: parseInt(meetingData.duration),
            participants: meetingData.participants,
            organizer: userId,
            timezone: userTimezone,
            status: 'scheduled'
        });

        // 4. Trigger Integrations Asynchronously
        // Send our custom HTML email via NodeMailer
        sendMeetingInvite(newMeeting);

        // If the user has linked their Google Calendar, push the event to Google
        if (user.oauth && user.oauth.refresh_token) {
            createGoogleCalendarEvent(user, newMeeting);
        }

        return { success: true, meeting: newMeeting };

    } catch (error) {
        console.error("Error creating meeting record:", error);
        return { success: false, message: "Database error while scheduling." };
    }
};

// Finds a meeting owned by the user by meeting ID
const getMeetingById = async (meetingId, userId) => {
    return await Meeting.findOne({ _id: meetingId, organizer: userId });
};

// Reschedule a meeting
const rescheduleMeeting = async (meetingId, userId, { date, time, duration }) => {
    try {
        const meeting = await getMeetingById(meetingId, userId);
        if (!meeting || meeting.status === 'cancelled') {
            return { success: false, message: 'Meeting not found or already cancelled.' };
        }

        // Check for conflict with existing meetings
        const conflict = await Meeting.findOne({
            organizer: userId,
            _id: { $ne: meetingId },
            date,
            startTime: time,
            status: 'scheduled'
        });

        if (conflict) {
            return { success: false, message: 'A different meeting already exists at that new date/time.' };
        }

        meeting.date = date || meeting.date;
        meeting.startTime = time || meeting.startTime;
        meeting.duration = duration ? parseInt(duration) : meeting.duration;
        meeting.status = 'rescheduled';

        await meeting.save();

        return { success: true, meeting };
    } catch (error) {
        console.error('Error rescheduling meeting:', error);
        return { success: false, message: 'Database error while rescheduling.' };
    }
};

// Cancel a meeting
const cancelMeeting = async (meetingId, userId) => {
    try {
        const meeting = await getMeetingById(meetingId, userId);
        if (!meeting || meeting.status === 'cancelled') {
            return { success: false, message: 'Meeting not found or already cancelled.' };
        }

        meeting.status = 'cancelled';
        await meeting.save();

        return { success: true, meeting };
    } catch (error) {
        console.error('Error cancelling meeting:', error);
        return { success: false, message: 'Database error while cancelling.' };
    }
};

// Returns the next upcoming meeting for a user (scheduled/rescheduled and in future)
const getNextUpcomingMeeting = async (userId) => {
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];

    const meeting = await Meeting.find({
        organizer: userId,
        status: { $in: ['scheduled', 'rescheduled'] },
        date: { $gte: todayISO }
    }).sort({ date: 1, startTime: 1 }).limit(1);

    return meeting[0] || null;
};

module.exports = {
    createMeetingRecord,
    getMeetingById,
    rescheduleMeeting,
    cancelMeeting,
    getNextUpcomingMeeting
};