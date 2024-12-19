const express = require('express');
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const cors = require('cors');

const app = express();
connectDB();
app.use(express.json());
app.use(cors({ origin: '*' }));

app.get("/", (req, res) => {
    res.send({
        message: "Api Wasteapp Telkom University",
        author: "https://github.com/wasteapptech/wasteapp_flutterapp",
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);


app.use((req, res, next) => {
    res.status(404).send({
        message: "Where are you going?",
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));
