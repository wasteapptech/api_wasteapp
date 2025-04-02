const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Register token FCM
router.post('/register-token', notificationController.registerToken);

// Kirim test notification
router.post('/send-test', notificationController.sendTestNotification);

module.exports = router;