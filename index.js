const express = require('express');
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const cors = require('cors');

const app = express();
connectDB();
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


app.use((req, res, next) => {
    res.status(404).send({
        message: "Where are you goingg?",
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));
