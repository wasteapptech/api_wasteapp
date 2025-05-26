const notificationService = require('../services/notificationService');

xports.registerToken = async (req, res) => {
  try {
      const { token } = req.body;
      
      if (!token) {
          return res.status(400).json({ error: 'Token is required' });
      }

      const testResult = await notificationService.testSingleToken(token, 'Welcome!', 'Your notifications are now active');
      
      if (testResult.success) {
          const result = await notificationService.registerDeviceToken(token);
          res.status(200).json({ 
              success: true, 
              message: 'Token registered and tested successfully',
              testMessageId: testResult.messageId
          });
      } else {
          res.status(400).json({ 
              error: 'Token validation failed', 
              details: testResult.error 
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