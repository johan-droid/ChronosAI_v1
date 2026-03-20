const { google } = require('googleapis');

// @desc    Pushes a meeting event to the user's Google Calendar
const createGoogleCalendarEvent = async (user, meetingDetails) => {
    try {
        // 1. Initialize OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        // 2. Load the user's saved tokens into the client
        oauth2Client.setCredentials({
            access_token: user.oauth.access_token,
            refresh_token: user.oauth.refresh_token,
            expiry_date: user.oauth.expiry_date
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // 3. Format Dates (Google strictly requires ISO 8601 Date strings)
        // We parse "2026-03-20" and "15:00" into proper JavaScript Date objects
        const startDateTime = new Date(`${meetingDetails.date}T${meetingDetails.startTime}:00`);
        const endDateTime = new Date(startDateTime.getTime() + meetingDetails.duration * 60000);

        // 4. Construct the Google Event Payload
        const event = {
            summary: meetingDetails.title,
            description: 'Scheduled automatically by ChronosAI.',
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: meetingDetails.timezone,
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: meetingDetails.timezone,
            },
            // Map our array of email strings into the array of objects Google expects
            attendees: meetingDetails.participants.map(email => ({ email })),
        };

        // 5. Insert the event into the user's primary calendar
        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            sendUpdates: 'all' // Tells Google to automatically email the attendees!
        });

        console.log(`📅 Google Calendar event created: ${response.data.htmlLink}`);
        return { success: true, link: response.data.htmlLink };

    } catch (error) {
        console.error("❌ Error creating Google Calendar event:", error.message);
        return { success: false, message: error.message };
    }
};

module.exports = { createGoogleCalendarEvent };