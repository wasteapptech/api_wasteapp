module.exports = {
    getCurrentTimestamp: () => {
        return Date.now();
    },
    formatTimestamp: (timestamp) => {
        return new Date(timestamp).toISOString();
    }
};