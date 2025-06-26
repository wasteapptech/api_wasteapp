const newsService = require('../services/newsService');

export default async function handler(req, res) {
    // Ganti ke GET request
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Cek header authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer wasteapp_123xyz_secret`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        await newsService.fetchNewsAndUpdateDatabase();
        return res.status(200).json({ success: true, message: 'News fetched successfully' });
    } catch (error) {
        console.error('Cron job error:', error);
        return res.status(500).json({ error: 'Failed to fetch news' });
    }
}
