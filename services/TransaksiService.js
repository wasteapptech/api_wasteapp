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
    const userTotalRef = db.ref('userAdjustedTotals').child(email.replace('.', '_'));
    
    const [transaksiSnapshot, totalSnapshot] = await Promise.all([
        transaksiRef.orderByChild('email').equalTo(email).once('value'),
        userTotalRef.once('value')
    ]);
    
    const transaksi = [];
    transaksiSnapshot.forEach((childSnapshot) => {
        transaksi.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
        });
    });
    
    const adjustment = totalSnapshot.val()?.adjustment || 0;
    const calculatedTotal = transaksi.reduce((total, t) => {
        return total + (t.totalTransaksi || 0);
    }, 0);
    
    const adjustedTotal = calculatedTotal + adjustment;
    
    return {
        transaksi,
        calculatedTotal,
        adjustedTotal
    };
};

exports.updateUserBalance = async (email, newBalance) => {
    const userBalanceRef = db.ref('userBalances').child(email.replace('.', '_'));
    await userBalanceRef.set({
        balance: newBalance,
        updatedAt: new Date().toISOString()
    });
    return { email, balance: newBalance };
};

exports.getUserBalance = async (email) => {
    const userBalanceRef = db.ref('userBalances').child(email.replace('.', '_'));
    const snapshot = await userBalanceRef.once('value');
    return snapshot.val()?.balance || 0;
};

exports.updateTotalTransaksi = async (email, newTotal) => {
    const userTotalRef = db.ref('userTotals').child(email.replace('.', '_'));
    await userTotalRef.set({
        totalTransaksi: newTotal,
        updatedAt: new Date().toISOString()
    });
    return { email, totalTransaksi: newTotal };
};

exports.getUserTotal = async (email) => {
    const userTotalRef = db.ref('userTotals').child(email.replace('.', '_'));
    const snapshot = await userTotalRef.once('value');
    return snapshot.val()?.totalTransaksi || 0;
};

exports.updateUserTransaksiTotal = async (email, newTotal) => {
    const { calculatedTotal } = await exports.getTransaksiByUser(email);
    
    const adjustment = newTotal - calculatedTotal;
    const userTotalRef = db.ref('userAdjustedTotals').child(email.replace('.', '_'));
    await userTotalRef.set({
        adjustment,
        updatedAt: new Date().toISOString()
    });
    
    return { success: true, newTotal };
};