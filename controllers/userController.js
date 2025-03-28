const User = require('../models/user');


exports.getUserProfile = async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email }).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Retrieve profile failed' });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { currentEmail, newEmail, name } = req.body;

    const user = await User.findOne({ email: currentEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (newEmail && newEmail !== currentEmail) {
      const emailExists = await User.findOne({ email: newEmail });
      if (emailExists) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      user.email = newEmail;
    }

    if (name && name !== user.name) {
      user.name = name;
    }

    await user.save();
    const updatedUser = await User.findById(user._id).select('-password');
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'Profile update failed',
      details: error.message 
    });
  }
};