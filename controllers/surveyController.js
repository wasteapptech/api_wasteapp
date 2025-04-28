const { db } = require('../config/firebase');
const { getCurrentTimestamp, formatTimestamp } = require('../utils/datetimeHelper');

exports.submitSurvey = async (req, res) => {
    try {
        const { email, answers } = req.body;
        
        if (!email || !answers) {
            return res.status(400).json({ error: 'Email and answers are required' });
        }

        const surveysRef = db.ref('surveys');
        const timestamp = getCurrentTimestamp();

        // Check if survey exists
        const snapshot = await surveysRef.orderByChild('email').equalTo(email).once('value');
        
        if (snapshot.exists()) {
            // Update existing survey
            const surveyData = snapshot.val();
            const surveyId = Object.keys(surveyData)[0];
            
            await surveysRef.child(surveyId).update({
                answers,
                completed: true,
                updatedAt: timestamp
            });
        } else {
            // Create new survey
            const newSurveyRef = surveysRef.push();
            await newSurveyRef.set({
                email,
                answers,
                completed: true,
                createdAt: timestamp,
                updatedAt: timestamp
            });
        }

        res.json({ 
            message: 'Survey submitted successfully',
            timestamp: formatTimestamp(timestamp)
        });
    } catch (error) {
        console.error('Survey submission error:', error);
        res.status(500).json({ error: 'Survey submission failed' });
    }
};

exports.getSurvey = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const surveysRef = db.ref('surveys');
        const snapshot = await surveysRef.orderByChild('email').equalTo(email).once('value');
        
        if (!snapshot.exists()) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        const surveyData = snapshot.val();
        const surveyId = Object.keys(surveyData)[0];
        const survey = surveyData[surveyId];

        if (!survey.completed) {
            return res.status(404).json({ error: 'Survey not completed' });
        }

        // Format the response
        const response = {
            id: surveyId,
            email: survey.email,
            answers: survey.answers,
            completed: survey.completed,
            createdAt: formatTimestamp(survey.createdAt),
            updatedAt: formatTimestamp(survey.updatedAt)
        };

        res.json(response);
    } catch (error) {
        console.error('Get survey error:', error);
        res.status(500).json({ error: 'Failed to retrieve survey' });
    }
};

exports.checkSurveyStatus = async (req, res) => {
    try {
        const { email } = req.params;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const surveysRef = db.ref('surveys');
        const snapshot = await surveysRef.orderByChild('email').equalTo(email).once('value');
        
        if (snapshot.exists()) {
            const surveyData = snapshot.val();
            const surveyId = Object.keys(surveyData)[0];
            const survey = surveyData[surveyId];
            
            return res.status(200).json({ 
                completed: survey.completed,
                timestamp: formatTimestamp(survey.updatedAt)
            });
        } else {
            return res.status(200).json({ completed: false });
        }
    } catch (error) {
        console.error('Check survey status error:', error);
        res.status(500).json({ error: 'Failed to check survey status' });
    }
};