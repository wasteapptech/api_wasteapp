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
    const { email, newEmail, name } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (newEmail) {
      user.email = newEmail;
    }

    if (name) {
      user.name = name;
    }

    await user.save();
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
};
