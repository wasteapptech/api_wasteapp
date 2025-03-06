const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const surveyController = require('../controllers/surveyController');


router.get('/profile', userController.getUserProfile);
router.put('/profile', userController.updateUserProfile);
router.post('/survey', surveyController.submitSurvey);
router.get('/survey', surveyController.getSurvey);

module.exports = router;