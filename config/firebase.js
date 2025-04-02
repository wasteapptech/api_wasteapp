const admin = require('firebase-admin');

// Properly handle newlines in private key
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();
module.exports = { admin, db };