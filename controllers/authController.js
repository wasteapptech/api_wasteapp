const User = require('../models/user');

exports.signup = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        const { name, email, password } = req.body;  
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: 'User ini sudah terdaftar' });
        }

        const user = new User({ name, email, password });  
        await user.save();

        res.status(201).json({ message: 'User ini berhasil terdaftar' });
    } catch (error) {
        res.status(500).json({ error: 'Signup gagal, silahkan coba lagi' });
    }
};


exports.signin = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: 'Email  yang kamu input tidak ditemukan' });
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
            return res.status(404).json({ error: 'User ini tidak terdaftar' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ 
            message: 'Password baru berhasil terdaftar',
            user: { name: user.name, email: user.email }, // Mengembalikan nama pengguna dalam respons
        });
    } catch (error) {
        res.status(500).json({ error: 'Kesalahan mengupdate password' });
    }
};
