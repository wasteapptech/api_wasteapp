const Survey = require('../models/survey');
const User = require('../models/user');

// Mengirim jawaban survei
exports.submitSurvey = async (req, res) => {
    try {
        const { email, answers } = req.body;

        // Check if a survey already exists for this email
        let survey = await Survey.findOne({ email });

        if (survey) {
            // Update existing survey
            survey.answers = answers;
            survey.completed = true;
        } else {
            // Create a new survey
            survey = new Survey({
                email,
                answers,
                completed: true,
            });
        }

        await survey.save();
        res.json({ message: 'Survey submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Survey submission failed' });
    }
};

// Mendapatkan jawaban survei
exports.getSurvey = async (req, res) => {
    try {
        const { email } = req.query;

        // Find the survey by email
        const survey = await Survey.findOne({ email });

        if (!survey || !survey.completed) {
            return res.status(404).json({ error: 'Survey not found or not completed' });
        }

        res.json(survey);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve survey' });
    }
};
