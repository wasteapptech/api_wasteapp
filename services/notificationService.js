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

exports.sendNotificationToAllDevices = async (title, body, imageUrl = null) => {
    try {
        const snapshot = await db.ref('tokens').once('value');
        const tokens = [];

        snapshot.forEach(childSnapshot => {
            tokens.push(childSnapshot.val().token);
        });

        if (tokens.length === 0) {
            return { success: false, message: 'No device tokens available' };
        }

        // Base message configuration
        const message = {
            notification: {
                title: title,
                body: body
            },
            data: {
                // Data tambahan jika diperlukan
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
            }
        };

        // Tambahkan gambar jika ada
        if (imageUrl) {
            // Untuk Android
            message.android = {
                notification: {
                    imageUrl: imageUrl
                }
            };

            // Untuk iOS
            message.apns = {
                payload: {
                    aps: {
                        'mutable-content': 1
                    },
                    fcm_options: {
                        image: imageUrl
                    }
                }
            };

            // Untuk web/other platforms
            message.notification.image = imageUrl;
        }

        // Batasi pengiriman ke 500 device per batch (limit FCM)
        const sendPromises = tokens.slice(0, 500).map(token => {
            return admin.messaging().send({
                ...message,
                token: token
            }).catch(error => {
                console.log('Error sending to token:', token, error);
                // Jika token tidak valid, hapus dari database
                if (error.code === 'messaging/invalid-registration-token' || 
                    error.code === 'messaging/registration-token-not-registered') {
                    const sanitizedToken = token.replace(/[.#$/[\]]/g, '_');
                    db.ref('tokens').child(sanitizedToken).remove();
                }
                return false;
            });
        });

        const results = await Promise.all(sendPromises);
        const successCount = results.filter(result => result !== false).length;

        return {
            success: true,
            successCount: successCount,
            failureCount: tokens.length - successCount,
            imageIncluded: imageUrl !== null
        };
    } catch (error) {
        console.error('Error sending notifications:', error);
        throw error;
    }
};