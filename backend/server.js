const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const { cleanupExpiredTokens } = require('./meetingManager/scheduleMeeting');

const app = express();
app.use(cors()); 
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes')); 
app.use('/api/chat', require('./routes/dialogueRoutes')); 
app.use('/api/calendar', require('./routes/calendarRoutes')); 
app.use('/api/meetings', require('./routes/meetingRoutes')); 
app.use('/api/users', require('./routes/usersRoutes'));

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'ChronosAI Backend API is up!' });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    connectDB();
    app.listen(PORT, () => {
        console.log(`🚀 Server is listening on port ${PORT}`);

        // Start periodic cleanup for expired JWT-like meeting join tokens.
        setInterval(async () => {
            try {
                const result = await cleanupExpiredTokens();
                if (result.modifiedCount > 0) {
                    console.log(`🧹 Cleanup: removed expired tokens from ${result.modifiedCount} meeting(s).`);
                }
            } catch (error) {
                console.error('Error during cleanupExpiredTokens:', error);
            }
        }, 60 * 1000); // every 1 minute
    });
}

module.exports = app;