const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');


router.get('/', newsController.getAllNews);
router.post('/fetch', newsController.fetchNewsFromAPI);

module.exports = router;