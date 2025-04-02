const { db, admin } = require('../config/firebase');
const admin = require("firebase-admin");

exports.registerDeviceToken = async (token) => {
  try {
    console.log('Registering token:', token);
    
    if (!token) {
      throw new Error('Token is required');
    }

    const sanitizedToken = token.replace(/[.#$/[\]]/g, '_');
    await db.ref('tokens').child(sanitizedToken).set({
      token: token,
      createdAt: admin.database.ServerValue.TIMESTAMP
    });

    return { success: true };
  } catch (error) {
    console.error('Error in registerDeviceToken:', error);
    throw error;
  }
};

exports.sendNotificationToAllDevices = async (title, body) => {
    try {
        const snapshot = await db.ref('tokens').once('value');
        const tokens = [];

        snapshot.forEach(childSnapshot => {
            tokens.push(childSnapshot.val().token);
        });

        if (tokens.length === 0) {
            return { success: false, message: 'No device tokens available' };
        }

        // The fix: messaging() is already initialized, and sendMulticast expects a message object directly
        const multicastMessage = {
            notification: { title, body },
            tokens: tokens.slice(0, 500) // FCM allows maximum 500 tokens per request
        };

        const response = await messaging().sendMulticast(multicastMessage);

        return {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount
        };
    } catch (error) {
        console.error('Error sending notifications:', error);
        throw error;
    }
};