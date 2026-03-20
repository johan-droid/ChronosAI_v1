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

module.exports = { createMeetingRecord };