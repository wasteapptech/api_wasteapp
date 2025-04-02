const { db, admin } = require('../config/firebase');
const axios = require('axios');
const notificationService = require('./notificationService');

// Get semua berita
exports.getAllNews = async () => {
    const snapshot = await db.ref('news').once('value');
    const data = snapshot.val();

    // Transform data dari object ke array
    const newsArray = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key]
    })) : [];

    // Sort by publishedAt descending
    newsArray.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    return newsArray;
};

// Fetch berita dari API dan update database
exports.fetchNewsAndUpdateDatabase = async () => {
    const apiKey = '4976a49c841d4519b5a32851ccc51f54';
    const url = `https://newsapi.org/v2/everything?q=sampah+OR+waste+management+OR+recycling&language=id&sortBy=publishedAt&apiKey=${apiKey}`;

    try {
        console.log('Fetching news from API...');
        const response = await axios.get(url);
        const data = response.data;

        if (data.status === 'ok' && data.articles) {
            // Dapatkan ID berita yang sudah ada
            const snapshot = await db.ref('news').once('value');
            const existingNewsUrls = new Set();

            snapshot.forEach(childSnapshot => {
                const article = childSnapshot.val();
                existingNewsUrls.add(article.url);
            });

            // Filter hanya artikel baru
            const newArticles = data.articles.filter(article => !existingNewsUrls.has(article.url));

            if (newArticles.length > 0) {
                // Simpan artikel baru ke Firebase
                await Promise.all(newArticles.map(article => {
                    const sanitizedUrl = article.url.replace(/[.#$/[\]]/g, '_');
                    return db.ref(`news/${sanitizedUrl}`).set({
                        title: article.title,
                        description: article.description,
                        url: article.url,
                        publishedAt: article.publishedAt,
                        source: article.source.name,
                        timestamp: admin.database.ServerValue.TIMESTAMP
                    });
                }));

                console.log(`Added ${newArticles.length} new articles to database`);

                // Kirim notifikasi untuk artikel paling baru
                if (newArticles.length > 0) {
                    const latestArticle = newArticles[0];
                    await notificationService.sendNotificationToAllDevices(
                        'Berita Terbaru',
                        latestArticle.title || 'Ada berita baru tentang pengelolaan sampah'
                    );
                }

                return {
                    success: true,
                    message: `Added ${newArticles.length} new articles`,
                    newArticles: newArticles.map(article => ({
                        title: article.title,
                        url: article.url
                    }))
                };
            } else {
                console.log('No new articles found');
                return {
                    success: true,
                    message: 'No new articles found'
                };
            }
        }

        return {
            success: false,
            message: 'Failed to fetch news from API'
        };
    } catch (error) {
        console.error('Error fetching and processing news:', error);
        throw error;
    }
};