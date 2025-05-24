const { db } = require('../config/firebase');

exports.createTransaksi = async (transaksiData) => {
    const transaksiRef = db.ref('transaksi');
    const newTransaksiRef = transaksiRef.push();
    
    const timestamp = new Date().toISOString();
    const dataToSave = {
        ...transaksiData,
        createdAt: timestamp
    };
    
    await newTransaksiRef.set(dataToSave);
    return { id: newTransaksiRef.key, ...dataToSave };
};

exports.getAllTransaksi = async () => {
    const transaksiRef = db.ref('transaksi');
    const snapshot = await transaksiRef.once('value');
    const transaksi = [];
    
    snapshot.forEach((childSnapshot) => {
        transaksi.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
        });
    });
    
    return transaksi;
};

exports.getTransaksiByUser = async (email) => {
    const transaksiRef = db.ref('transaksi');
    const snapshot = await transaksiRef.orderByChild('email').equalTo(email).once('value');
    const transaksi = [];
    
    snapshot.forEach((childSnapshot) => {
        transaksi.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
        });
    });
    
    return transaksi;
};