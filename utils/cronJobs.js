const cron = require('node-cron');
const newsService = require('../services/newsService');

// Inisialisasi cron jobs
exports.initCronJobs = () => {
    // Fetch news dari API setiap 5 menit
    cron.schedule('* * * * *', async () => {
        try {
            console.log('Running scheduled task: fetchNewsAndUpdateDatabase');
            await newsService.fetchNewsAndUpdateDatabase();
        } catch (error) {
            console.error('Error in scheduled task:', error);
        }
    });

    // Jalankan fetch berita pertama kali
    setTimeout(async () => {
        try {
            console.log('Initial fetch of news data');
            await newsService.fetchNewsAndUpdateDatabase();
        } catch (error) {
            console.error('Error in initial news fetch:', error);
        }
    }, 1000);
};