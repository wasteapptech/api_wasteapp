const User = require('../models/user');


exports.getUserProfile = async (req, res) => {
 try {
        const { name } = req.query; // Ambil parameter name dari query
        const user = await User.findOne({ name });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            name: user.name,
            email: user.email,
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { currentName, newName, newEmail } = req.body;

    // 1. Find user by current name (username)
    const user = await User.findOne({ name: currentName });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Update name if provided
    if (newName) {
      user.name = newName;
    }

    // 3. Update email if provided
    if (newEmail) {
      // Check if email already exists
      const emailExists = await User.findOne({ email: newEmail });
      if (emailExists) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      user.email = newEmail;
    }

    await user.save();

    // Return updated user data
    const updatedUser = {
      name: user.name,
      email: user.email
      // other fields...
    };
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Update failed',
      details: error.message 
    });
  }
};