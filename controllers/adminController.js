const Admin = require("../models/admin");

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const admin = await Admin.findOne({ username });
        if (!admin) return res.status(404).json({ message: "Admin tidak ditemukan" });

        if (password !== admin.password) return res.status(400).json({ message: "Password salah" });

        res.json({ message: "Login berhasil", username: admin.username });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
