// In-memory store for active conversations
// Key: userId, Value: conversation state object
const activeSessions = new Map();

// Fetch the current conversation state for a user, or create a new one
const getSession = (userId) => {
    if (!activeSessions.has(userId)) {
        activeSessions.set(userId, {
            intent: null,
            date: null,
            time: null,
            duration: null,
            participants: []
        });
    }
    return activeSessions.get(userId);
};

// Update the session with new data from the AI
const updateSession = (userId, updates) => {
    const session = getSession(userId);
    const newSession = { ...session, ...updates };
    activeSessions.set(userId, newSession);
    return newSession;
};

// Clear the session once the meeting is scheduled
const clearSession = (userId) => {
    activeSessions.delete(userId);
};

module.exports = { getSession, updateSession, clearSession };