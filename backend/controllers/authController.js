const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { google } = require('googleapis');
const generateToken = require('../utils/generateToken');

const GOOGLE_AUTH_REDIRECT_URI = process.env.GOOGLE_AUTH_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_AUTH_REDIRECT_URI
);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password, timezone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password_hash: password,
            timezone: timezone || 'UTC'
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                timezone: user.timezone,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error("Error in registerUser:", error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password_hash');

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.status(200).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            timezone: user.timezone,
            token: generateToken(user._id)
        });

    } catch (error) {
        console.error("Error in loginUser:", error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    // Because the request passed through our middleware, req.user is already populated!
    res.status(200).json(req.user);
};

// @desc    Generate Google OAuth2 URL for login/signup
// @route   GET /api/auth/google-url
// @access  Public
const getGoogleAuthUrl = (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['openid', 'profile', 'email'],
        redirect_uri: GOOGLE_AUTH_REDIRECT_URI,
    });

    res.status(200).json({
        url,
        expectedRedirectUri: GOOGLE_AUTH_REDIRECT_URI,
        usedRedirectUri: GOOGLE_AUTH_REDIRECT_URI,
    });
};

// @desc    Handle Google OAuth2 callback and issue local JWT
// @route   GET /api/auth/google/callback
// @access  Public
const handleGoogleCallback = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.status(400).send('Missing code parameter');
        }

        // Explicitly re-construct the callback URI here for safety
        oauth2Client.redirectUri = GOOGLE_AUTH_REDIRECT_URI;

        const { tokens } = await oauth2Client.getToken({
            code,
            redirect_uri: GOOGLE_AUTH_REDIRECT_URI
        });
        oauth2Client.setCredentials(tokens);

        const ticket = await oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const email = payload?.email;
        const name = payload?.name || payload?.email?.split('@')[0];

        if (!email) {
            return res.status(400).send('Google user email is required');
        }

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name,
                email,
                password_hash: crypto.randomBytes(32).toString('hex'),
                timezone: 'UTC',
                oauth: {
                    access_token: tokens.access_token || null,
                    refresh_token: tokens.refresh_token || null,
                    expiry_date: tokens.expiry_date || null,
                }
            });
        } else {
            user.oauth = {
                access_token: tokens.access_token || user.oauth?.access_token,
                refresh_token: tokens.refresh_token || user.oauth?.refresh_token,
                expiry_date: tokens.expiry_date || user.oauth?.expiry_date,
            };
            await user.save();
        }

        const jwtToken = generateToken(user._id);

        res.redirect(`${FRONTEND_URL}/oauth2/redirect?token=${jwtToken}`);

    } catch (error) {
        console.error('Google callback error:', error);
        res.status(500).send('Google login failed');
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,    // <-- Add this!
    getGoogleAuthUrl,
    handleGoogleCallback,
};