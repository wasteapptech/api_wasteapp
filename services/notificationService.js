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
                ...(imageUrl && { image: imageUrl }) // Only add image if exists
            },
            data: {
                type: type,
                ...(imageUrl && { image_url: imageUrl }), // Only add if exists
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                id: Date.now().toString()
            },
            android: {
                notification: {
                    ...(imageUrl && { imageUrl: imageUrl }), // Only add if exists
                    priority: 'high',
                    channel_id: 'wasteapp_channel'
                }
            },
            apns: {
                payload: {
                    aps: {
                        'mutable-content': 1,
                        'content-available': 1
                    }
                },
                ...(imageUrl && { fcm_options: { image: imageUrl } }) // Only add if exists
            }
        };

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