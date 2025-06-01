const notificationService = require('../services/notificationService');

exports.registerToken = async (req, res) => {
    try {
        const { token, skipTest } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const registrationResult = await notificationService.registerDeviceToken(token);

        if (skipTest) {
            return res.status(200).json({
                success: true,
                message: 'Token registered successfully'
            });
        }

        try {
            const welcomeImageUrl = "https://res.cloudinary.com/dljgctufu/image/upload/v1748771332/survey_vkufm1.png"; 
            const testResult = await notificationService.testSingleToken(
                token, 
                'Welcome ges di WasteApp', 
                'Your notifications are now active yeyyyy',
                welcomeImageUrl
            );
            res.status(200).json({
                success: true,
                message: 'Token registered and tested successfully',
                testMessageId: testResult.messageId
            });
        } catch (testError) {
            res.status(200).json({
                success: true,
                message: 'Token registered but test failed',
                testError: testError.message
            });
        }
    } catch (error) {
        console.error('Error registering token:', error);
        res.status(500).json({ error: 'Failed to register token' });
    }
};

exports.cleanupTokens = async (req, res) => {
    try {
        const { tokens } = req.body;

        if (!tokens || !Array.isArray(tokens)) {
            return res.status(400).json({ error: 'Array of tokens is required' });
        }

        await notificationService.cleanupInvalidTokens(tokens);
        res.status(200).json({ success: true, message: `Cleaned up ${tokens.length} tokens` });
    } catch (error) {
        console.error('Error cleaning up tokens:', error);
        res.status(500).json({ error: 'Failed to cleanup tokens' });
    }
};


exports.sendTestNotification = async (req, res) => {
    try {
        const { title, body } = req.body;

        if (!title || !body) {
            return res.status(400).json({ error: 'Title and body are required' });
        }

        const result = await notificationService.sendNotificationToAllDevices(title, body);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({ error: 'Failed to send test notification' });
    }
};
