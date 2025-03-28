// controllers/adminController.js
const Admin = require("../models/admin");

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(404).json({ message: "Admin tidak ditemukan" });

    const isMatch = password === admin.password; // Hardcoded password check
    if (!isMatch) return res.status(400).json({ message: "Password salah" });

    const token = jwt.sign({ id: admin._id }, "SECRET_KEY", { expiresIn: "1h" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
