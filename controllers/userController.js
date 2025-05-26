const { db } = require('../config/firebase');
const { getCurrentTimestamp, formatTimestamp } = require('../utils/datetimeHelper');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const streamifier = require('streamifier');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ storage: multer.memoryStorage() });

const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'image',
                folder: 'avatars'
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

exports.uploadAvatar = upload.single('avatar');

exports.getUserProfile = async (req, res) => {
    try {
        const { name } = req.query;

        if (!name) {
            return res.status(400).json({ error: 'Name parameter is required' });
        }

        const profilesRef = db.ref('profiles');
        const snapshot = await profilesRef.orderByChild('name').equalTo(name).once('value');

        if (!snapshot.exists()) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = snapshot.val();
        const userId = Object.keys(userData)[0];
        const user = userData[userId];

        res.status(200).json({
            id: userId,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl || null,  
            createdAt: formatTimestamp(user.createdAt),
            updatedAt: formatTimestamp(user.updatedAt)
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const { currentName, newName, newEmail } = req.body;

        if (!currentName) {
            return res.status(400).json({ error: 'Current name is required' });
        }

        const timestamp = getCurrentTimestamp();
        const profilesRef = db.ref('profiles');
        const usersRef = db.ref('users');
        const updates = {};
        const userUpdates = {};

        const snapshot = await profilesRef.orderByChild('name').equalTo(currentName).once('value');

        if (!snapshot.exists()) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = snapshot.val();
        const profileId = Object.keys(userData)[0];
        const profile = userData[profileId];
        const userId = profile.userId;

        if (req.file) {
            try {
                if (profile.avatarPublicId) {
                    await cloudinary.uploader.destroy(profile.avatarPublicId);
                }

                const cloudinaryResult = await uploadToCloudinary(req.file.buffer);
                updates.avatarUrl = cloudinaryResult.secure_url;
                updates.avatarPublicId = cloudinaryResult.public_id;
                userUpdates.avatarUrl = cloudinaryResult.secure_url;
            } catch (uploadError) {
                console.error('Error uploading avatar:', uploadError);
                return res.status(500).json({ error: 'Failed to upload avatar' });
            }
        }

        // Check and update name
        if (newName && newName !== currentName) {
            // Verify new name isn't already taken
            const nameCheck = await profilesRef.orderByChild('name').equalTo(newName).once('value');
            if (nameCheck.exists()) {
                return res.status(400).json({ error: 'Username already in use' });
            }
            updates.name = newName;
            userUpdates.name = newName;
        }

        if (newEmail && newEmail !== profile.email) {
            const emailCheck = await profilesRef.orderByChild('email').equalTo(newEmail).once('value');
            if (emailCheck.exists()) {
                const existingProfile = emailCheck.val();
                const existingProfileId = Object.keys(existingProfile)[0];
                if (existingProfileId !== profileId) {
                    return res.status(400).json({ error: 'Email already in use' });
                }
            }
            updates.email = newEmail;
            userUpdates.email = newEmail;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(200).json({
                message: 'No changes detected',
                user: {
                    name: profile.name,
                    email: profile.email,
                    avatarUrl: profile.avatarUrl
                }
            });
        }

        updates.updatedAt = timestamp;
        userUpdates.updatedAt = timestamp;
        await Promise.all([
            profilesRef.child(profileId).update(updates),
            usersRef.child(userId).update(userUpdates)
        ]);

        const updatedUser = {
            name: updates.name || profile.name,
            email: updates.email || profile.email,
            avatarUrl: updates.avatarUrl || profile.avatarUrl
        };

        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser,
            updatedAt: formatTimestamp(timestamp)
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            error: 'Profile update failed',
            details: error.message
        });
    }
};