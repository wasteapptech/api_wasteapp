const Survey = require('../models/survey');

// Mengirim jawaban survei
exports.submitSurvey = async (req, res) => {
    try {
        const { email, answers } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let survey = await Survey.findOne({ user: user._id });

        if (survey) {
            survey.answers = answers;
            survey.completed = true;
        } else {
            survey = new Survey({
                user: user._id,
                answers,
                completed: true
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

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const survey = await Survey.findOne({ user: user._id });

        if (!survey || !survey.completed) {
            return res.status(404).json({ error: 'Survey not found or not completed' });
        }

        res.json(survey);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve survey' });
    }
};

// Mendapatkan jawaban survei yang belum selesai

exports.getIncompleteSurveys = async (req, res) => {
    try {
        const { email } = req.query;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const incompleteSurveys = await Survey.find({ user: user._id, completed: false });

        if (!incompleteSurveys.length) {
            return res.status(404).json({ error: 'No incomplete surveys found' });
        }

        res.json(incompleteSurveys);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve incomplete surveys' });
    }
};