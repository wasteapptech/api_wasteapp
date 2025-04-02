const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

// Get semua berita
router.get('/', newsController.getAllNews);

// Trigger manual fetch berita dari API
router.post('/fetch', newsController.fetchNewsFromAPI);

module.exports = router;