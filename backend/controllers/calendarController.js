const { google } = require('googleapis');
const User = require('../models/User');

// Initialize the Google OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// @desc    Generate Google Auth URL for the user to click
// @route   GET /api/calendar/auth-url
// @access  Private (User must be logged in to our app first)
const getAuthUrl = (req, res) => {
    const userId = req.user._id.toString();

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // 'offline' is required to receive a refresh_token
        prompt: 'consent',      // Forces Google to show the consent screen so we always get a refresh token
        scope: [
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/calendar.readonly'
        ],
        state: userId // We pass the user's database ID through Google so we know who is logging in when they come back!
    });

    res.status(200).json({ url });
};

// @desc    Handle the redirect from Google and save tokens
// @route   GET /api/calendar/callback
// @access  Public (Google hits this route directly)
const handleAuthCallback = async (req, res) => {
    // Google sends the authorization code and our original state (userId) in the URL query
    const { code, state } = req.query;
    const userId = state;

    try {
        // Exchange the authorization code for actual access/refresh tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        // Save the tokens directly to the user's database profile
        await User.findByIdAndUpdate(userId, {
            'oauth.access_token': tokens.access_token,
            'oauth.refresh_token': tokens.refresh_token, // Only sent on first authorization
            'oauth.expiry_date': tokens.expiry_date
        });

        // In a real app, you would redirect the user back to the React frontend dashboard here
        res.status(200).send("<h3>Google Calendar linked successfully!</h3><p>You can close this tab and return to ChronosAI.</p>");

    } catch (error) {
        console.error("Error exchanging tokens:", error.message);
        res.status(500).send("Failed to link calendar. Please try again.");
    }
};

module.exports = {
    getAuthUrl,
    handleAuthCallback
};