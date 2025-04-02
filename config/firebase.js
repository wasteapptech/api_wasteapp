const admin = require('firebase-admin');
const path = require('path');


admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Important for line breaks
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });

const db = admin.database();

module.exports = {
  admin,
  db
};