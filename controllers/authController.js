const User = require('../models/user');

exports.signup = async (req, res) => {
    try {
        console.log('Request body:', req.body); // Check the incoming data
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const user = new User({ name, email, password });
        await user.save();

        res.status(201).json({ message: 'User successfully registered' });
    } catch (error) {
        console.error('Error:', error);  // Log the error for debugging
        res.status(500).json({ error: 'Signup failed, please try again' });
    }
};



exports.signin = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        const { name, password } = req.body;
        const user = await User.findOne({ name });

        if (!user) {
            return res.status(400).json({ error: 'username yang kamu input tidak ditemukan' });
        }
        if (user.password !== password) {
            return res.status(400).json({ error: 'Password salah' });
        }

        res.status(201).json({ 
            message: 'Signin sukses', 
            user: {
                name: user.name,  
                email: user.email,
            }
        });
    } catch (error) {
        console.error('Error during signin:', error);
        res.status(500).json({ error: 'Signin gagal. Silahkan coba lagi.' });
    }
};



exports.forgotPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
