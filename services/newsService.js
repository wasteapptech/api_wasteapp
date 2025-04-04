const axios = require('axios');
const cheerio = require('cheerio');
const { db } = require('../config/firebase'); 
const notificationService = require('./notificationService');


const scrapeDetikSampahArticles = async () => {
    try {
        const url = 'https://www.detik.com/tag/sampah';
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const articles = [];

        $('article').each((index, element) => {
            const $article = $(element);
            if ($article.hasClass('foto_tag')) return;

            const title = $article.find('h2.title').text().trim();
            const url = $article.find('a').attr('href');
            const image = $article.find('img').attr('data-src') || $article.find('img').attr('src');
            const date = $article.find('span.date').text().replace(/\s+/g, ' ').trim();
            const category = $article.find('span.category').text().trim();
            const description = $article.find('p').text().trim();

            if (title && url) {
                articles.push({
                    title,
                    url,
                    image: image || null,
                    date,
                    category,
                    description,
                    scrapedAt: new Date().toISOString(),
                    type: 'article'
                });
            }
        });

        $('article.foto_tag .item').each((index, element) => {
            const $item = $(element);
            const title = $item.find('h2.title').text().trim();
            const url = $item.find('a').attr('href');
            const imageStyle = $item.find('.ratiobox_content').attr('style') || '';
            const imageMatch = imageStyle.match(/background-image:\s*url\(['"]?(.*?)['"]?\)/i);
            const image = imageMatch ? imageMatch[1] : null;

            if (title && url) {
                articles.push({
                    title,
                    url,
                    image: image || null,
                    scrapedAt: new Date().toISOString(),
                    type: 'photo_article'
                });
            }
        });

        return articles;
    } catch (error) {
        console.error('Error scraping Detik.com:', error);
        throw error;
    }
};

const getAllNews = async () => {
    try {
        const snapshot = await db.ref('sampah_articles').orderByChild('scrapedAt').limitToLast(50).once('value');
        const newsData = snapshot.val();

        return newsData ? Object.entries(newsData).map(([id, data]) => ({ id, ...data })) : [];
    } catch (error) {
        console.error('Error getting news from Firebase:', error);
        throw error;
    }
};

const fetchNewsAndUpdateDatabase = async () => {
    try {
        const scrapedArticles = await scrapeDetikSampahArticles();
        const existingUrls = await getExistingArticleUrls();

        const updates = {};
        let newArticlesCount = 0;

        scrapedArticles.forEach(article => {
            if (!existingUrls.includes(article.url)) {
                const newKey = db.ref('sampah_articles').push().key;
                updates[`/sampah_articles/${newKey}`] = article;
                newArticlesCount++;
            }
        });

        if (newArticlesCount > 0) {
            await db.ref().update(updates);
        }

        return {
            success: true,
            message: `Added ${newArticlesCount} new articles`,
            count: newArticlesCount
        };
    } catch (error) {
        console.error('Error updating news database:', error);
        throw error;
    }
};

const getExistingArticleUrls = async () => {
    const snapshot = await db.ref('sampah_articles').once('value');
    const newsData = snapshot.val();

    return newsData ? Object.values(newsData).map(article => article.url) : [];
};

exports.fetchNewsAndUpdateDatabase = async () => {
    try {
        const apiNews = await fetchNewsFromExternalAPI(); // Your existing API fetch
        const newNewsItems = [];
        
        for (const item of apiNews) {
            const exists = await checkIfNewsExists(item.id); // Implement this check
            if (!exists) {
                const savedItem = await saveNewsToDatabase(item);
                newNewsItems.push(savedItem);
                
                // Send notification for each new news item
                await notificationService.sendNotificationToAllDevices(
                    'Berita Baru: ' + item.title,
                    item.description || item.content.substring(0, 100) + '...',
                    item.imageUrl // Make sure your API returns imageUrl
                );
            }
        }
        
        return {
            totalFetched: apiNews.length,
            newItems: newNewsItems.length,
            newItems
        };
    } catch (error) {
        console.error('Error in fetchNewsAndUpdateDatabase:', error);
        throw error;
    }
};

module.exports = {
    getAllNews,
    fetchNewsAndUpdateDatabase
};