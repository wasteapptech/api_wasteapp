const newsService = require('../services/newsService');

// Ubah dari export default ke module.exports
module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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
};