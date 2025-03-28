const express = require("express");
const connectDB = require("./config/database");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const surveyRoutes = require("./routes/survey");
const adminRoutes = require("./routes/admin");
const kegiatanRoutes = require("./routes/kegiatan");
const Admin = require("./models/admin");

const app = express();

connectDB().then(async () => {
    try {
        const adminExists = await Admin.findOne({ username: "admin" });
        if (!adminExists) {
            await Admin.create({ username: "admin", password: "waste123" });
            console.log("Admin default dibuat: admin / waste123");
        } else {
            console.log("Admin sudah ada");
        }
    } catch (err) {
        console.log("Gagal mengecek/membuat admin default:", err);
    }
}).catch(err => console.log("Database connection error:", err));

app.use(express.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get("/", (req, res) => {
    res.send({
        message: "Api Wasteapp",
        author: "https://github.com/wasteapptech/wasteapp_flutterapp",
    });
});


app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/submit/", surveyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/kegiatan", kegiatanRoutes);

app.use((req, res, next) => {
    res.status(404).send({
        message: "Where are you goingg mann?",
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));
