const Meeting = require('../models/Meeting');
const User = require('../models/User');
const { sendMeetingInvite, sendMeetingReschedule, sendMeetingCancellation } = require('../integrations/emailService');
const { createGoogleCalendarEvent } = require('../integrations/calendarService');

const getMinutesFromTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const normalized = timeStr.trim().toLowerCase()
        .replace(/(am|pm)$/, '')
        .replace(/\s+/g, '');

    let [hours, minutes] = normalized.split(':').map(Number);
    if (isNaN(minutes)) minutes = 0;

    // Support 3pm formats
    const pmMatch = /pm$/i.test(timeStr);
    const amMatch = /am$/i.test(timeStr);
    if (pmMatch && hours < 12) hours += 12;
    if (amMatch && hours === 12) hours = 0;

    return hours * 60 + minutes;
};

const timesOverlap = (startA, endA, startB, endB) => {
    return startA < endB && startB < endA;
};

const findConflictingMeeting = async ({ date, startTime, duration, organizerId, participants = [], excludedMeetingId = null }) => {
    const startMinutes = getMinutesFromTime(startTime);
    const endMinutes = startMinutes + parseInt(duration, 10);

    const query = {
        date,
        status: { $in: ['scheduled', 'rescheduled'] },
        $or: [
            { organizer: organizerId },
            { participants: { $in: participants } }
        ]
    };
    if (excludedMeetingId) {
        query._id = { $ne: excludedMeetingId };
    }

    const candidateMeetings = await Meeting.find(query);
    for (const existing of candidateMeetings) {
        const existingStart = getMinutesFromTime(existing.startTime);
        const existingEnd = existingStart + existing.duration;
        if (timesOverlap(startMinutes, endMinutes, existingStart, existingEnd)) {
            return existing;
        }
    }

    return null;
};

const checkAvailability = async ({ date, startTime, duration, participants = [], organizerId }) => {
    const conflict = await findConflictingMeeting({ date, startTime, duration, organizerId, participants });
    if (conflict) {
        return {
            available: false,
            conflictWith: {
                meetingId: conflict._id,
                title: conflict.title,
                date: conflict.date,
                startTime: conflict.startTime,
                duration: conflict.duration,
                organizer: conflict.organizer,
                participants: conflict.participants
            }
        };
    }
    return { available: true };
};

// @desc    Creates a new meeting in the database and pushes to integrations
const createMeetingRecord = async (meetingData, userId, userTimezone) => {
    try {
        const normalizedParticipants = Array.isArray(meetingData.participants)
            ? [...new Set(meetingData.participants.map(p => p.trim().toLowerCase()))]
            : [];

        // 1. Conflict Check (Internal DB) across organizer + participants
        const conflict = await findConflictingMeeting({
            date: meetingData.date,
            startTime: meetingData.time,
            duration: meetingData.duration,
            organizerId: userId,
            participants: normalizedParticipants
        });

        if (conflict) {
            return { success: false, message: 'You already have a meeting scheduled at this time.', conflict };
        }

        // 2. Fetch the user to get their Google OAuth tokens
        const user = await User.findById(userId).select('+oauth.refresh_token');

        // 3. Save to database
        const meetingRoom = `chronosai-${new Date().getTime()}-${Math.random().toString(36).substr(2, 8)}`;
        const jitsiLink = `https://meet.jit.si/${meetingRoom}`;

        const meetingPassword = Math.random().toString(36).slice(2, 8);

        const newMeeting = await Meeting.create({
            title: meetingData.title || `Meeting with ${normalizedParticipants.join(', ')}`,
            date: meetingData.date,
            startTime: meetingData.time,
            duration: parseInt(meetingData.duration, 10),
            participants: normalizedParticipants,
            organizer: userId,
            organizerEmail: user ? user.email : '',
            timezone: userTimezone || (user ? user.timezone : 'UTC'),
            meetingRoom,
            meetingLink: `${jitsiLink}#config.password=${meetingPassword}`,
            meetingPassword,
            waitingRoomEnabled: false,
            status: 'scheduled'
        });

        // attach meeting details page link (useful for shared route)
        newMeeting.detailPageLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/meetings/${newMeeting._id}`;
        await newMeeting.save();

        // 4. Trigger Integrations Asynchronously
        sendMeetingInvite(newMeeting);

        if (user && user.oauth && user.oauth.refresh_token) {
            createGoogleCalendarEvent(user, newMeeting).catch(err => {
                console.warn('Google event push failed (optional):', err.message);
            });
        }

        return { success: true, meeting: newMeeting };

    } catch (error) {
        console.error('Error creating meeting record:', error);
        return { success: false, message: 'Database error while scheduling.' };
    }
};

// Gets meeting by ID or by organizer (if userId provided)
const getMeetingById = async (meetingId, userId = null) => {
    if (userId) {
        return await Meeting.findOne({ _id: meetingId, organizer: userId });
    }
    return await Meeting.findById(meetingId);
};

const requestWaitingRoomAccess = async (meetingId, userEmail) => {
    const meeting = await getMeetingById(meetingId);
    if (!meeting) {
        return { success: false, message: 'Meeting not found.' };
    }

    if (!meeting.waitingRoomEnabled) {
        return { success: true, message: 'No waiting room active. Auto-approved.' };
    }

    if (meeting.pendingRequests.includes(userEmail) || meeting.approvedRequests.includes(userEmail)) {
        return { success: false, message: 'Request already exists or already approved.' };
    }

    meeting.pendingRequests = [...meeting.pendingRequests, userEmail];
    await meeting.save();
    return { success: true, message: 'Request submitted.' };
};

const approveWaitingRoomRequest = async (meetingId, organizerId, userEmail) => {
    const meeting = await getMeetingById(meetingId, organizerId);
    if (!meeting) {
        return { success: false, message: 'Meeting not found or access denied.' };
    }
    if (!meeting.pendingRequests.includes(userEmail)) {
        return { success: false, message: 'Request not found.' };
    }
    meeting.pendingRequests = meeting.pendingRequests.filter((e) => e !== userEmail);
    meeting.approvedRequests = [...new Set([...meeting.approvedRequests, userEmail])];
    await meeting.save();
    return { success: true, meeting };
};

const declineWaitingRoomRequest = async (meetingId, organizerId, userEmail) => {
    const meeting = await getMeetingById(meetingId, organizerId);
    if (!meeting) {
        return { success: false, message: 'Meeting not found or access denied.' };
    }
    meeting.pendingRequests = meeting.pendingRequests.filter((e) => e !== userEmail);
    await meeting.save();
    return { success: true, meeting };
};

const generateJoinToken = async (meetingId, userEmail) => {
    const meeting = await getMeetingById(meetingId);
    if (!meeting) {
        return { success: false, message: 'Meeting not found.' };
    }

    const isOrganizer = meeting.organizerEmail === userEmail;
    const isApproved = meeting.approvedRequests.includes(userEmail);
    if (meeting.waitingRoomEnabled && !isOrganizer && !isApproved) {
        return { success: false, message: 'Waiting room approval required.' };
    }

    const token = Math.random().toString(36).substr(2, 35) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    meeting.joinTokens = [...meeting.joinTokens, { email: userEmail, token, createdAt: new Date(), expiresAt }];
    await meeting.save();

    return { success: true, token, expiresAt }; 
};

const validateJoinToken = async (meetingId, token) => {
    const meeting = await getMeetingById(meetingId);
    if (!meeting) {
        return { valid: false, message: 'Meeting not found.' };
    }

    const tokenRecord = meeting.joinTokens.find((t) => t.token === token);
    if (!tokenRecord) {
        return { valid: false, message: 'Invalid token.' };
    }

    if (new Date(tokenRecord.expiresAt) < new Date()) {
        return { valid: false, message: 'Token expired.' };
    }

    return { valid: true, email: tokenRecord.email };
};

// Reschedule a meeting
const rescheduleMeeting = async (meetingId, userId, { date, time, duration }) => {
    try {
        const meeting = await getMeetingById(meetingId, userId);
        if (!meeting || meeting.status === 'cancelled') {
            return { success: false, message: 'Meeting not found or already cancelled.' };
        }

        // Calculate target values to check against conflicts
        const targetDate = date || meeting.date;
        const targetTime = time || meeting.startTime;
        const targetDuration = duration ? parseInt(duration, 10) : meeting.duration;

        const conflict = await findConflictingMeeting({
            date: targetDate,
            startTime: targetTime,
            duration: targetDuration,
            organizerId: userId,
            participants: meeting.participants,
            excludedMeetingId: meetingId
        });

        if (conflict) {
            return { success: false, message: 'A different meeting already exists for organizer or participant at the requested new time.' };
        }

        meeting.date = targetDate;
        meeting.startTime = targetTime;
        meeting.duration = targetDuration;
        meeting.status = 'rescheduled';

        await meeting.save();
        sendMeetingReschedule(meeting);

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
        sendMeetingCancellation(meeting);

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
    getNextUpcomingMeeting,
    checkAvailability,
    findConflictingMeeting,
    requestWaitingRoomAccess,
    approveWaitingRoomRequest,
    declineWaitingRoomRequest,
    generateJoinToken,
    validateJoinToken
};