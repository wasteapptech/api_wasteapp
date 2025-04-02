const admin = require('firebase-admin');
const path = require('path');

// Inisialisasi Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://wasteappcore-default-rtdb.firebaseio.com/" 
});

const db = admin.database();

module.exports = {
  admin,
  db
};