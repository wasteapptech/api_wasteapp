const mongoose = require("mongoose");
const connectDB = require("./config/database");
const Admin = require("./models/admin");

const seedAdmin = async () => {
    try {
        await connectDB();

        const adminExists = await Admin.findOne({ username: "admin" });
        if (!adminExists) {
            await Admin.create({ username: "admin", password: "waste123" });
            console.log("✅ Admin default berhasil dibuat: admin / waste123");
        } else {
            console.log("⚠️ Admin sudah ada, tidak perlu ditambahkan.");
        }

        mongoose.connection.close();
    } catch (error) {
        console.error("❌ Error saat seeding admin:", error);
        mongoose.connection.close();
    }
};

seedAdmin();
