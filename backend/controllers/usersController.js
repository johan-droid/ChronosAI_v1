const User = require('../models/User');

// @desc    Get all users (admin view)
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password_hash -oauth');
    res.status(200).json(users);
  } catch (error) {
    console.error('Failed to fetch users', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

module.exports = {
  getUsers,
};
