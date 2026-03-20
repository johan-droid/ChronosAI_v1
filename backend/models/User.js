const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password_hash: {
        type: String,
        required: [true, 'Please add a password'],
        select: false // Automatically hide this field when querying users
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    timezone: {
        type: String,
        required: true,
        default: 'UTC'
    },
    // The OAuth fields we added during the Architecture Review (Issue 1)
    oauth: {
        access_token: { type: String, default: null },
        refresh_token: { type: String, default: null },
        expiry_date: { type: Number, default: null }
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

const bcrypt = require('bcryptjs'); // Add this at the very top of the file

// ... (your existing userSchema code) ...

// Encrypt password before saving
userSchema.pre('save', async function (next) {
    // If the password field wasn't modified, skip this (useful for when users update their profile but not their password)
    if (!this.isModified('password_hash')) {
        next();
    }

    // Generate a 'salt' (random data added to the password before hashing)
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the salt
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
});

module.exports = mongoose.model('User', userSchema);
