const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.post('/register-token', notificationController.registerToken);
router.post('/cleanup', notificationController.cleanupTokens);

module.exports = router;