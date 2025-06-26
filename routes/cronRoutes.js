const express = require('express');
const router = express.Router();
const newsService = require('../services/newsService');

router.get('/', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        await newsService.fetchNewsAndUpdateDatabase();
        return res.status(200).json({ success: true, message: 'News fetched successfully' });
    } catch (error) {
        console.error('Cron job error:', error);
        return res.status(500).json({ error: 'Failed to fetch news' });
    }
});

module.exports = router;
