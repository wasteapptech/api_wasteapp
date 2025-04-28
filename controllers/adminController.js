const { admin, db } = require("../config/firebase");
const {
    hashPassword,
    comparePassword,
    validatePasswordStrength
} = require("../utils/authHelper");

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const adminsRef = db.ref('admins');
        const snapshot = await adminsRef.orderByChild('username').equalTo(username).once('value');

        if (!snapshot.exists()) {
            return res.status(404).json({ message: "Admin tidak ditemukan" });
        }

        const adminData = snapshot.val();
        const adminId = Object.keys(adminData)[0];
        const admin = adminData[adminId];

        const passwordMatch = await comparePassword(password, admin.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: "Password salah" });
        }

        res.json({
            message: "Login berhasil",
            username: admin.username
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.createAdmin = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Validate password strength
        if (!validatePasswordStrength(password)) {
            return res.status(400).json({
                message: "Password harus mengandung minimal 8 karakter, huruf besar, huruf kecil, angka, dan karakter khusus"
            });
        }

        const adminsRef = db.ref('admins');
        const snapshot = await adminsRef.orderByChild('username').equalTo(username).once('value');

        if (snapshot.exists()) {
            return res.status(400).json({ message: "Admin sudah ada" });
        }

        const hashedPassword = await hashPassword(password);

        const newAdminRef = adminsRef.push();
        await newAdminRef.set({
            username,
            password: hashedPassword,
            createdAt: admin.database.ServerValue.TIMESTAMP
        });

        res.status(201).json({
            message: "Admin berhasil dibuat",
            username,
            id: newAdminRef.key
        });
    } catch (err) {
        console.error("Create admin error:", err);
        res.status(500).json({ message: "Server error" });
    }
};