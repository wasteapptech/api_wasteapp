const newsService = require('../services/newsService');

exports.initCronJobs = () => {
    console.log('Initial fetch of news data');
    newsService.fetchNewsAndUpdateDatabase()
        .catch(error => console.error('Error in initial news fetch:', error));

    setInterval(async () => {
        try {
            console.log('Running scheduled task: fetchNewsAndUpdateDatabase');
            await newsService.fetchNewsAndUpdateDatabase();
        } catch (error) {
            console.error('Error in scheduled task:', error);
        }
    }, 300000); // 5 minutes interval
};