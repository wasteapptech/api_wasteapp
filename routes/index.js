const express = require('express');
const router = express.Router();

// Import routes
const kegiatanRoutes = require('./kegiatan');
const newsRoutes = require('./news');
const notificationRoutes = require('./notification');

// Gunakan routes
router.use('/kegiatan', kegiatanRoutes);
router.use('/news', newsRoutes);
router.use('/notification', notificationRoutes);

module.exports = router;