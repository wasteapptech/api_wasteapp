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
        const tokens = snapshot.val() ? Object.values(snapshot.val()).map(t => t.token) : [];

        if (tokens.length === 0) {
            console.log('Tidak ada device token terdaftar');
            return { success: false, message: 'No registered devices' };
        }

        console.log(`Sending notification with image: ${imageUrl}`);

        // Base message structure
        const message = {
            notification: {
                title,
                body,
                imageUrl: imageUrl || undefined
            },
            data: {
                title,
                body,
                imageUrl: imageUrl || ''
            },
            android: {
                priority: 'high',
                notification: {
                    imageUrl: imageUrl || undefined,
                    priority: 'high',
                    visibility: 'public'
                }
            },
            apns: {
                headers: {
                    'apns-priority': '10'
                },
                payload: {
                    aps: {
                        alert: {
                            title,
                            body
                        },
                        'mutable-content': 1,
                        'content-available': 1
                    }
                },
                fcm_options: {
                    image: imageUrl || undefined
                }
            },
            webpush: {
                notification: {
                    title,
                    body,
                    icon: imageUrl || undefined,
                    image: imageUrl || undefined
                },
                headers: {
                    Urgency: 'high'
                }
            }
        };

        // Kirim ke semua device (dalam batch 500)
        const batchSize = 500;
        const batches = Math.ceil(tokens.length / batchSize);
        let successCount = 0;

        for (let i = 0; i < batches; i++) {
            const batchTokens = tokens.slice(i * batchSize, (i + 1) * batchSize);

            try {
                const response = await admin.messaging().sendEachForMulticast({
                    tokens: batchTokens,
                    ...message
                });
                
                successCount += response.successCount;
                console.log(`Batch ${i+1} notification sent. Success: ${response.successCount}, Failure: ${response.failureCount}`);
                
                // Log failure details if any
                if (response.failureCount > 0) {
                    console.log('Failure details:', response.responses.filter(r => !r.success));
                }
            } catch (batchError) {
                console.error(`Error batch ${i+1}:`, batchError);
            }
        }

        return {
            success: true,
            sentCount: successCount,
            totalDevices: tokens.length,
            imageIncluded: !!imageUrl
        };
    } catch (error) {
        console.error('Error in sendNotificationToAllDevices:', error);
        throw error;
    }
};