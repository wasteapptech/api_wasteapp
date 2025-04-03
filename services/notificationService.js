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

        // Konfigurasi dasar notifikasi
        const message = {
            notification: {
                title: title,
                body: body
            },
            android: {
                notification: {
                    imageUrl: imageUrl || undefined // Untuk Android
                }
            },
            apns: {
                payload: {
                    aps: {
                        'mutable-content': imageUrl ? 1 : 0 // Untuk iOS
                    },
                    fcm_options: {
                        image: imageUrl || undefined // Untuk iOS
                    }
                }
            },
            webpush: {
                headers: {
                    image: imageUrl || undefined // Untuk web
                }
            }
        };

        // Tambahkan gambar jika ada
        if (imageUrl) {
            message.notification.image = imageUrl;
        }

        // Kirim ke semua device (dalam batch 500)
        const batchSize = 500;
        const batches = Math.ceil(tokens.length / batchSize);
        let successCount = 0;

        for (let i = 0; i < batches; i++) {
            const batchTokens = tokens.slice(i * batchSize, (i + 1) * batchSize);

            try {
                const response = await admin.messaging().sendEachForMulticast({
                    ...message,
                    tokens: batchTokens
                });
                successCount += response.successCount;
            } catch (batchError) {
                console.error(`Error batch ${i}:`, batchError);
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
}
