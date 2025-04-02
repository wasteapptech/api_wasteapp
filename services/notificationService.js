const { db, admin } = require('../config/firebase');

// Register device token
// In your notificationController.js
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

// Kirim notifikasi ke semua perangkat
exports.sendNotificationToAllDevices = async (title, body) => {
    try {
        // Ambil semua token FCM
        const snapshot = await db.ref('tokens').once('value');
        const tokens = [];

        snapshot.forEach(childSnapshot => {
            tokens.push(childSnapshot.val().token);
        });

        if (tokens.length === 0) {
            console.log('No device tokens available');
            return {
                success: false,
                message: 'No device tokens available'
            };
        }

        // Kirim notifikasi menggunakan Firebase Admin SDK
        const message = {
            notification: {
                title: title,
                body: body
            },
            tokens: tokens.slice(0, 500) // Maksimum 500 token per request
        };

        const response = await admin.messaging().sendMulticast(message);
        console.log(`${response.successCount} messages were sent successfully`);

        // Hapus token yang tidak valid
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                }
            });

            // Remove failed tokens
            await Promise.all(failedTokens.map(token =>
                db.ref('tokens').orderByChild('token').equalTo(token).once('value')
                    .then(snapshot => {
                        snapshot.forEach(childSnapshot => {
                            childSnapshot.ref.remove();
                        });
                    })
            ));
        }

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