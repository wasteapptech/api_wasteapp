const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected Successfully gan');
    } catch (error) {
        console.error('MongoDB Connection Error', error);
        process.exit(1);
    }
};

module.exports = connectDB;