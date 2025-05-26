const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/profiles', userController.getAllUserProfiles);
router.get('/profile', userController.getUserProfile);
router.put('/profile', userController.uploadAvatar, userController.updateUserProfile);

module.exports = router;