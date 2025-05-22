const admin = require('firebase-admin');
const { db } = require('../config/firebase'); 

const defaultHarga = {
    'botol plastik': 50,
    'kemasan plastik': 15,
    'gelas plastik': 40,
    'kemasan kaleng': 70,
    'kantong plastik': 10,
    'pisang': 50,
    'wortel': 50,
    'apel': 50,
    'jeruk': 50,
    'sayuran': 50
};

exports.initializeHarga = async () => {
    const hargaRef = db.ref('harga');
    const snapshot = await hargaRef.once('value');
    if (!snapshot.exists()) {
        await hargaRef.set(defaultHarga);
    }
};

exports.getHarga = async () => {
    const hargaRef = db.ref('harga');
    const snapshot = await hargaRef.once('value');
    return snapshot.val();
};

exports.updateHarga = async (newHarga) => {
    const hargaRef = db.ref('harga');
    await hargaRef.update(newHarga);
    const snapshot = await hargaRef.once('value');
    return snapshot.val();
};