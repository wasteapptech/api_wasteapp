const { db, admin } = require('../config/firebase');

exports.registerDeviceToken = async (token) => {
    try {
        console.log('Registering token:', token);

        if (!token) {
            throw new Error('Token is required');
        }

        if (!token.match(/^[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/)) {
            console.log('Token format validation passed');
        }

        const sanitizedToken = token.replace(/[.#$/[\]]/g, '_');
        
        await db.ref('tokens').child(sanitizedToken).set({
            token: token,
            createdAt: admin.database.ServerValue.TIMESTAMP,
            lastUsed: admin.database.ServerValue.TIMESTAMP,
            isActive: true
        });

        console.log('Token registered successfully');
        return { success: true };
    } catch (error) {
        console.error('Error in registerDeviceToken:', error);
        throw error;
    }
};

exports.cleanupInvalidTokens = async (invalidTokens) => {
    try {
        const promises = invalidTokens.map(async (token) => {
            const sanitizedToken = token.replace(/[.#$/[\]]/g, '_');
            await db.ref('tokens').child(sanitizedToken).remove();
            console.log('Removed invalid token:', sanitizedToken);
        });
        
        await Promise.all(promises);
        console.log(`Cleaned up ${invalidTokens.length} invalid tokens`);
    } catch (error) {
        console.error('Error cleaning up tokens:', error);
    }
};

exports.sendNotificationToAllDevices = async (title, body, imageUrl = null, type = 'kegiatan') => {
    try {
        console.log('Starting notification send process...');
        
        const snapshot = await db.ref('tokens').once('value');
        const tokenData = [];
        const validTokens = [];

        snapshot.forEach(childSnapshot => {
            const data = childSnapshot.val();
            if (data && data.token && data.isActive !== false) {
                tokenData.push(data);
                validTokens.push(data.token);
            }
        });

        if (validTokens.length === 0) {
            console.log('No valid device tokens available');
            return { success: false, message: 'No device tokens available' };
        }

        console.log(`Found ${validTokens.length} valid tokens`);

        const message = {
            notification: {
                title: title,
                body: body,
                ...(imageUrl && { image: imageUrl })
            },
            data: {
                type: type,
                ...(imageUrl && { image_url: imageUrl }),
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                id: Date.now().toString(),
                timestamp: new Date().toISOString()
            },
            android: {
                notification: {
                    ...(imageUrl && { imageUrl: imageUrl }),
                    priority: 'high',
                    channel_id: 'wasteapp_channel',
                    sound: 'default'
                },
                priority: 'high',
                ttl: 3600000
            },
            apns: {
                payload: {
                    aps: {
                        alert: {
                            title: title,
                            body: body
                        },
                        sound: 'default',
                        badge: 1,
                        'mutable-content': 1,
                        'content-available': 1
                    }
                },
                ...(imageUrl && { fcm_options: { image: imageUrl } })
            }
        };
        
        const BATCH_SIZE = 100; 
        let successCount = 0;
        let failedCount = 0;
        const invalidTokens = [];
        const errors = [];

        for (let i = 0; i < validTokens.length; i += BATCH_SIZE) {
            const batch = validTokens.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(validTokens.length/BATCH_SIZE)}`);
            
            try {
                const messages = batch.map(token => ({
                    token: token,
                    ...message
                }));

                const response = await admin.messaging().sendEach(messages);
                
                response.responses.forEach((resp, index) => {
                    if (resp.success) {
                        successCount++;
                    } else {
                        failedCount++;
                        const error = resp.error;
                        const failedToken = batch[index];
                        
                        console.log(`Failed to send to token: ${failedToken}`);
                        console.log(`Error: ${error.code} - ${error.message}`);
                        
                        if (error.code === 'messaging/invalid-registration-token' || 
                            error.code === 'messaging/registration-token-not-registered') {
                            invalidTokens.push(failedToken);
                        }
                        
                        errors.push({
                            token: failedToken,
                            error: error.code,
                            message: error.message
                        });
                    }
                });

                if (i + BATCH_SIZE < validTokens.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

            } catch (batchError) {
                console.error(`Error processing batch starting at index ${i}:`, batchError);
                failedCount += batch.length;
                errors.push({
                    batch: i,
                    error: batchError.code || 'unknown',
                    message: batchError.message
                });
            }
        }

        if (invalidTokens.length > 0) {
            console.log(`Cleaning up ${invalidTokens.length} invalid tokens`);
            await exports.cleanupInvalidTokens(invalidTokens);
        }

        const result = {
            success: successCount > 0,
            total: validTokens.length,
            sent: successCount,
            failed: failedCount,
            invalidTokensRemoved: invalidTokens.length
        };

        console.log('Notification send completed:', result);

        // Log errors if any
        if (errors.length > 0) {
            console.log('Errors encountered:', errors);
        }

        return result;

    } catch (error) {
        console.error('Error in sendNotificationToAllDevices:', error);
        throw error;
    }
};

exports.testSingleToken = async (token, title = 'Test', body = 'Test notification', imageUrl = null) => {
    try {
        const message = {
            token: token,
            notification: {
                title: title,
                body: body,
                ...(imageUrl && { image: imageUrl })
            },
            data: {
                type: 'welcome',
                ...(imageUrl && { image_url: imageUrl }),
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                id: Date.now().toString(),
                timestamp: new Date().toISOString()
            },
            android: {
                notification: {
                    ...(imageUrl && { imageUrl: imageUrl }),
                    priority: 'high',
                    channel_id: 'wasteapp_channel',
                    sound: 'default'
                },
                priority: 'high'
            },
            apns: {
                payload: {
                    aps: {
                        alert: {
                            title: title,
                            body: body
                        },
                        sound: 'default'
                    }
                },
                ...(imageUrl && { fcm_options: { image: imageUrl } })
            }
        };

        const response = await admin.messaging().send(message);
        console.log('Test notification sent successfully:', response);
        return { success: true, messageId: response };
    } catch (error) {
        console.error('Test notification failed:', error);
        return { success: false, error: error.message };
    }
};