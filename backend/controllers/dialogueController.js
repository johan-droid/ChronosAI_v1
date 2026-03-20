const { createMeetingRecord } = require('../meetingManager/scheduleMeeting');
const axios = require('axios');
const { getSession, updateSession, clearSession } = require('../dialogueManager/stateTracker');

// @desc    Process user chat message
// @route   POST /api/chat
// @access  Private
const processChatMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user._id.toString(); // Extracted from our Auth Middleware!

        if (!message) {
            return res.status(400).json({ reply: "Please provide a message." });
        }

        // 1. Send the message to the Python AI Microservice
        const aiResponse = await axios.post('http://localhost:8000/parse-intent', { message });
        const extractedData = aiResponse.data.extracted_data;

        // 2. Fetch current conversation state for this specific user
        let session = getSession(userId);

        // 3. Update session with newly extracted data
        const updates = {};
        if (extractedData.intent && extractedData.intent !== 'unknown') updates.intent = extractedData.intent;
        if (extractedData.date) updates.date = extractedData.date;
        if (extractedData.time) updates.time = extractedData.time;
        if (extractedData.duration) updates.duration = extractedData.duration;
        if (extractedData.participants && extractedData.participants.length > 0) {
            // Merge existing participants with new ones, avoiding duplicates
            updates.participants = [...new Set([...session.participants, ...extractedData.participants])];
        }

        session = updateSession(userId, updates);

        // 4. Ambiguity Detection & Clarification Generator
        if (!session.intent || session.intent === 'unknown') {
            return res.status(200).json({ reply: "I'm not sure what you want to do. Would you like to schedule, reschedule, or cancel a meeting?" });
        }

        if (session.intent === 'schedule') {
            if (!session.participants || session.participants.length === 0) {
                return res.status(200).json({ reply: "With whom do you want to schedule the meeting?" });
            }
            if (!session.date) {
                return res.status(200).json({ reply: "On which date should the meeting be scheduled?" });
            }
            if (!session.time) {
                return res.status(200).json({ reply: "At what time should the meeting start?" });
            }
            if (!session.duration) {
                return res.status(200).json({ reply: "How long should the meeting last? (e.g., 30 minutes)" });
            }

            // If we reach this line, all required fields are filled!
            // In the next step, we will trigger the Scheduling Engine here.
            // --- NEW SCHEDULING LOGIC ---
            // Trigger the Scheduling Engine
            const scheduleResult = await createMeetingRecord(session, userId, req.user.timezone);

            if (!scheduleResult.success) {
                // If there is a conflict, clear the time so the user can pick a new one
                updateSession(userId, { time: null }); 
                return res.status(200).json({ reply: `I couldn't schedule that: ${scheduleResult.message} What other time works for you?` });
            }

            clearSession(userId); // Reset conversation after successful scheduling

            return res.status(200).json({ 
                reply: `Success! I have scheduled a ${scheduleResult.meeting.duration}-minute meeting with ${scheduleResult.meeting.participants.join(', ')} on ${scheduleResult.meeting.date} at ${scheduleResult.meeting.startTime}.`,
                meetingDetails: scheduleResult.meeting
            });
            // ----------------------------
        }

        // Placeholder for future logic
        return res.status(200).json({ reply: "Reschedule/Cancel logic coming soon." });

    } catch (error) {
        console.error("Error in Dialogue Manager:", error.message);
        // If the Python server is down, we catch the error gracefully
        res.status(500).json({ reply: "Sorry, my AI brain is currently offline. Please ensure the Python service is running." });
    }
};

module.exports = { processChatMessage };