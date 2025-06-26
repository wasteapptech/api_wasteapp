const axios = require('axios');
const { load } = require('cheerio');
const { db } = require('../config/firebase'); 
const notificationService = require('./notificationService');


const scrapeDetikSampahArticles = async () => {
    try {
        const url = 'https://www.detik.com/tag/sampah';
        const response = await axios.get(url);
        const $ = load(response.data);

        const articles = [];

        $('article').each((index, element) => {
            const $article = $(element);
            
            const baseData = {
                title: $article.find('h2.title').text().trim(),
                url: $article.find('a').attr('href'),
                scrapedAt: new Date().toISOString(),
                type: $article.hasClass('foto_tag') ? 'photo_article' : 'article'
            };

            // Cari gambar dengan berbagai metode
            let image = null;
            if ($article.hasClass('foto_tag')) {
                const imageStyle = $article.find('.ratiobox_content').attr('style') || '';
                const imageMatch = imageStyle.match(/background-image:\s*url\(['"]?(.*?)['"]?\)/i);
                image = imageMatch ? imageMatch[1] : null;
            } else {
                image = $article.find('img').attr('data-src') || $article.find('img').attr('src');
            }

            const additionalData = $article.hasClass('foto_tag') ? {} : {
                date: $article.find('span.date').text().replace(/\s+/g, ' ').trim(),
                category: $article.find('span.category').text().trim(),
                description: $article.find('p').text().trim()
            };

            if (baseData.title && baseData.url) {
                articles.push({
                    ...baseData,
                    image,
                    ...additionalData
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
        const newNewsItems = [];
        
        for (const article of scrapedArticles) {
            const exists = await checkIfArticleExists(article.url); 
            if (!exists) {
                const savedItem = await saveArticleToDatabase(article);
                newNewsItems.push(savedItem);

                // Ambil deskripsi jika ada
                let description = '';
                if (article.description && article.description.trim()) {
                    description = article.description;
                } else if (article.content && article.content.trim()) {
                    description = article.content.substring(0, 100) + '...';
                }

                await notificationService.sendNotificationToAllDevices(
                    'Berita Baru: ' + article.title,
                    description || undefined, // kalau kosong, gak dikasih
                    article.imageUrl
                );
            }
        }
        
        return {
            totalFetched: scrapedArticles.length,
            newCount: newNewsItems.length,
            newItems: newNewsItems
        };
    } catch (error) {
        console.error('Error in fetchNewsAndUpdateDatabase:', error);
        throw error;
    }
}


const checkIfArticleExists = async (url) => {
    const snapshot = await db.ref('sampah_articles')
        .orderByChild('url')
        .equalTo(url)
        .once('value');
    return snapshot.exists();
};

const saveArticleToDatabase = async (article) => {
    // Standarisasi field yang mungkin kosong
    const standardizedArticle = {
        title: article.title || 'No Title',
        url: article.url,
        image: article.image || null,
        date: article.date || '',
        category: article.category || '',
        description: article.description || '',
        scrapedAt: article.scrapedAt || new Date().toISOString(),
        type: article.type || 'article'
    };
    
    const newKey = db.ref('sampah_articles').push().key;
    await db.ref(`/sampah_articles/${newKey}`).set({
        ...standardizedArticle,
        id: newKey
    });
    return standardizedArticle;
};

module.exports = {
    getAllNews,
    fetchNewsAndUpdateDatabase
};