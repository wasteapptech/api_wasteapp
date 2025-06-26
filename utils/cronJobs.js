const newsService = require('../services/newsService');

exports.initCronJobs = () => {
    console.log('Initial fetch of news data');
    newsService.fetchNewsAndUpdateDatabase()
        .catch(error => console.error('Error in initial news fetch:', error));
};