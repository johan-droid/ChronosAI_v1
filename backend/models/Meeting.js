const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        default: 'Meeting scheduled via ChronosAI'
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true
    },
    startTime: {
        type: String, // Format: HH:mm
        required: true
    },
    duration: {
        type: Number, // In minutes
        required: true
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        type: String // Storing names/emails for now
    }],
    timezone: {
        type: String,
        required: true,
        default: 'UTC'
    },
    meetingRoom: {
        type: String,
        default: null
    },
    meetingLink: {
        type: String,
        default: null
    },
    meetingPassword: {
        type: String,
        default: null
    },
    waitingRoomEnabled: {
        type: Boolean,
        default: false
    },
    pendingRequests: [{
        type: String
    }],
    approvedRequests: [{
        type: String
    }],
    joinTokens: [{
        email: String,
        token: String,
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date }
    }],
    organizerEmail: {
        type: String,
        required: true
    },
    emailAudit: [{
        eventType: { type: String },
        to: [{ type: String }],
        cc: [{ type: String }],
        status: { type: String, enum: ['success', 'failed'] },
        message: { type: String },
        createdAt: { type: Date, default: Date.now }
    }],
    status: {
        type: String,
        enum: ['scheduled', 'rescheduled', 'cancelled'],
        default: 'scheduled'
    }
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);