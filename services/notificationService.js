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

exports.sendNotificationToAllDevices = async (title, body, imageUrl = null, type = 'kegiatan') => {
    try {
        const snapshot = await db.ref('tokens').once('value');
        const tokens = [];

        snapshot.forEach(childSnapshot => {
            tokens.push(childSnapshot.val().token);
        });

        if (tokens.length === 0) {
            return { success: false, message: 'No device tokens available' };
        }

        // Enhanced message structure
        const message = {
            notification: {
                title: title,
                body: body,
                image: imageUrl // Standard FCM image field
            },
            data: {
                type: type, // 'kegiatan' or 'news'
                image_url: imageUrl || '',
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                id: Date.now().toString() // Unique ID for each notification
            },
            android: {
                notification: {
                    imageUrl: imageUrl,
                    priority: 'high',
                    channel_id: 'wasteapp_channel' // Specific channel for kegiatan
                }
            },
            apns: {
                payload: {
                    aps: {
                        'mutable-content': 1,
                        'content-available': 1
                    }
                },
                fcm_options: {
                    image: imageUrl
                }
            }
        };

        // Clean up if no image
        if (!imageUrl) {
            delete message.notification.image;
            delete message.data.image_url;
            delete message.android.notification.imageUrl;
            delete message.apns.fcm_options.image;
            delete message.webpush.headers.image;
        }

        // Batch processing for better performance
        const BATCH_SIZE = 500;
        let successCount = 0;

        for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
            const batch = tokens.slice(i, i + BATCH_SIZE);
            const responses = await admin.messaging().sendEach(
                batch.map(token => ({
                    token: token,
                    ...message
                }))
            );
            successCount += responses.responses.filter(r => r.success).length;
        }

        return {
            success: true,
            sent: successCount,
            failed: tokens.length - successCount
        };
    } catch (error) {
        console.error('Error sending notifications:', error);
        throw error;
    }
};