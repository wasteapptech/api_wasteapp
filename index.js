require('dotenv').config();

const express = require('express');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const surveyRoutes = require('./routes/survey');
const adminRoutes = require("./routes/admin");
const { initCronJobs } = require('./utils/cronJobs');
const kegiatanRoutes = require('./routes/kegiatan');
const newsRoutes = require('./routes/news');
const notificationRoutes = require('./routes/notification');
const app = express();
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});



app.get("/", (req, res) => {
    res.send({
        message: "Api Wasteapp",
        author: "https://github.com/wasteapptech/wasteapp_flutterapp",
    });
});


app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/submit/', surveyRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/kegiatan', kegiatanRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/notification', notificationRoutes);


app.use((req, res, next) => {
    res.status(404).send({
        message: "Where are you goingg mann?",
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
    initCronJobs();
});