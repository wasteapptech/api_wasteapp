const { db, admin } = require('../config/firebase');

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

        // Create the message
        const message = {
            notification: {
                title: title,
                body: body
            }
        };

        // Send to each token individually instead of using multicast
        const sendPromises = tokens.slice(0, 500).map(token => {
            return admin.messaging().send({
                ...message,
                token: token // Send to individual token
            }).catch(error => {
                console.log('Error sending to token:', error);
                return false; // Continue with other tokens even if one fails
            });
        });

        const results = await Promise.all(sendPromises);
        const successCount = results.filter(result => result !== false).length;

        return {
            success: true,
            successCount: successCount,
            failureCount: tokens.length - successCount
        };
    } catch (error) {
        console.error('Error sending notifications:', error);
        throw error;
    }
};