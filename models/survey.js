const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    answers: {
        type: Map,
        of: String,
        required: true,
    },
    completed: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

module.exports = mongoose.model('Survey', surveySchema);