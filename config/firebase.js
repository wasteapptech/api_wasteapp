const admin = require('firebase-admin');
const path = require('path');

// Initialize with all required services
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

// Initialize services
const db = admin.database();
const messaging = admin.messaging(); // Explicitly initialize messaging

module.exports = {
  admin,
  db,
  messaging // Export messaging service
};