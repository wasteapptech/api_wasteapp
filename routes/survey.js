const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');

router.post('/survey', surveyController.submitSurvey);
router.get('/survey', surveyController.getSurvey);
router.get('/check/survey/:email', surveyController.checkSurveyStatus);

module.exports = router;