const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');

router.post('/survey', surveyController.submitSurvey);
router.get('/survey', surveyController.getSurvey);

module.exports = router;