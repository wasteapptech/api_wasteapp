const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/SensorController');

router.post('/data', sensorController.postSensorData);
router.get('/data', sensorController.getAllSensorData);
router.get('/data/latest', sensorController.getLatestSensorData);

module.exports = router;
