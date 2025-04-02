const newsService = require('../services/newsService');

exports.getAllNews = async (req, res) => {
    try {
        const newsArray = await newsService.getAllNews();
        res.status(200).json(newsArray);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Gagal memuat berita' });
    }
};

exports.fetchNewsFromAPI = async (req, res) => {
    try {
        const result = await newsService.fetchNewsAndUpdateDatabase();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching news from API:', error);
        res.status(500).json({ error: 'Gagal memuat berita dari API' });
    }
};