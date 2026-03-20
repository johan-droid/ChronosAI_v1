const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db'); // ADD THIS LINE

// Connect to Database
connectDB(); // ADD THIS LINE

const app = express();
app.use(cors()); 
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes')); 
app.use('/api/chat', require('./routes/dialogueRoutes')); // ADD THIS LINE
app.use('/api/calendar', require('./routes/calendarRoutes')); // ADD THIS LINE

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'ChronosAI Backend API is up!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is listening on port ${PORT}`);
});