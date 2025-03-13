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
    const { email, newEmail, name } = req.body;

    // Cari pengguna berdasarkan email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update data pengguna
    if (newEmail) {
      user.email = newEmail;
    }

    if (name) {
      user.name = name;
    }

    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
};
