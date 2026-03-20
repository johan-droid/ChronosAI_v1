const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    // Sign the token with the user's ID, our secret key, and set it to expire in 30 days
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

module.exports = generateToken;