const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    // Check if the authorization header exists and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // The header looks like: "Bearer eyJhbGciOiJIUzI1..."
            // We split it by the space and grab the actual token (the second item)
            token = req.headers.authorization.split(' ')[1];

            // Verify the token using our secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch the user from the database using the ID packed inside the token
            // We use .select('-password_hash') to ensure we NEVER attach the password to the request
            req.user = await User.findById(decoded.id).select('-password_hash');

            // The token is valid and we know who the user is. 
            // Call next() to pass the request to the actual route controller.
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

module.exports = { protect };