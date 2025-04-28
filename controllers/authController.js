const { db } = require('../config/firebase');
const {
    hashPassword,
    comparePassword,
    validatePasswordStrength
} = require('../utils/authHelper');
const { getCurrentTimestamp } = require('../utils/datetimeHelper');

exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        if (!validatePasswordStrength(password)) {
            return res.status(400).json({
                error: 'Password harus mengandung minimal 8 karakter, huruf besar, huruf kecil, angka, dan karakter khusus'
            });
        }

        const timestamp = getCurrentTimestamp();
        const usersRef = db.ref('users');
        const profilesRef = db.ref('profiles');

        // Check if user exists in either collection
        const emailCheck = await usersRef.orderByChild('email').equalTo(email).once('value');
        const nameCheck = await profilesRef.orderByChild('name').equalTo(name).once('value');

        if (emailCheck.exists() || nameCheck.exists()) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create user in both collections
        const hashedPassword = await hashPassword(password);
        const newUserRef = usersRef.push();
        const newProfileRef = profilesRef.push();

        await Promise.all([
            newUserRef.set({
                name,
                email,
                password: hashedPassword,
                createdAt: timestamp,
                updatedAt: timestamp,
                profileId: newProfileRef.key
            }),
            newProfileRef.set({
                name,
                email,
                createdAt: timestamp,
                updatedAt: timestamp,
                userId: newUserRef.key
            })
        ]);

        res.status(201).json({
            message: 'User successfully registered',
            userId: newUserRef.key,
            profileId: newProfileRef.key
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Signup failed, please try again' });
    }
};

exports.signin = async (req, res) => {
    try {
        const { name, password } = req.body;

        // First check in profiles (as that's where names are indexed)
        const profilesRef = db.ref('profiles');
        const profileSnapshot = await profilesRef.orderByChild('name').equalTo(name).once('value');

        if (!profileSnapshot.exists()) {
            return res.status(400).json({ error: 'Username tidak ditemukan' });
        }

        // Get the associated user record
        const profileData = profileSnapshot.val();
        const profileId = Object.keys(profileData)[0];
        const profile = profileData[profileId];
        const userId = profile.userId;

        const usersRef = db.ref('users');
        const userSnapshot = await usersRef.child(userId).once('value');
        const user = userSnapshot.val();

        if (!user) {
            return res.status(400).json({ error: 'User account not found' });
        }

        // Compare hashed password
        const passwordMatch = await comparePassword(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ error: 'Password salah' });
        }

        res.status(200).json({
            message: 'Signin sukses',
            user: {
                id: userId,
                profileId: profileId,
                name: profile.name,
                email: profile.email,
            }
        });
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ error: 'Signin gagal. Silahkan coba lagi.' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!validatePasswordStrength(newPassword)) {
            return res.status(400).json({
                error: 'Password harus mengandung minimal 8 karakter, huruf besar, huruf kecil, angka, dan karakter khusus'
            });
        }

        const usersRef = db.ref('users');
        const snapshot = await usersRef.orderByChild('email').equalTo(email).once('value');

        if (!snapshot.exists()) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = snapshot.val();
        const userId = Object.keys(userData)[0];
        const timestamp = getCurrentTimestamp();
        const hashedPassword = await hashPassword(newPassword);

        await Promise.all([
            usersRef.child(userId).update({
                password: hashedPassword,
                updatedAt: timestamp
            }),
            db.ref('profiles').child(userData[userId].profileId).update({
                updatedAt: timestamp
            })
        ]);

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};