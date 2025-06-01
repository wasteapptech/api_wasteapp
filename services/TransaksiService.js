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

exports.calculateTransactionTotals = async (email) => {
    const snapshot = await db.ref('transaksi')
        .orderByChild('email')
        .equalTo(email)
        .once('value');

    if (!snapshot.exists()) {
        return {
            transactions: [],
            total: 0,
            count: 0
        };
    }

    const transactions = [];
    let total = 0;

    snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const transactionTotal = data.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
        
        transactions.push({
            id: childSnapshot.key,
            ...data,
            calculatedTotal: transactionTotal
        });
        
        total += transactionTotal;
    });

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
        transactions,
        total,
        count: transactions.length,
        lastTransaction: transactions[0] // Most recent transaction
    };
};

exports.getAllTransaksi = async () => {
    const transaksiRef = db.ref('transaksi');
    const snapshot = await transaksiRef.once('value');
    const transactionsByEmail = {};
    
    // First group all transactions by email
    snapshot.forEach((childSnapshot) => {
        const transaction = {
            id: childSnapshot.key,
            ...childSnapshot.val()
        };
        
        if (!transactionsByEmail[transaction.email]) {
            transactionsByEmail[transaction.email] = [];
        }
        transactionsByEmail[transaction.email].push(transaction);
    });

    const results = [];
    for (const [email, transactions] of Object.entries(transactionsByEmail)) {
        const userTotals = await exports.calculateTransactionTotals(email);
        results.push({
            lastTransaksi: userTotals.lastTransaction,
            totalSemuaTransaksi: userTotals.total,
            jumlahTransaksi: userTotals.count
        });
    }

    return results;
};

exports.getTransaksiByUser = async (email) => {
    const totals = await exports.calculateTransactionTotals(email);
    
    return {
        transaksi: totals.transactions,
        totalSemuaTransaksi: Number(totals.total.toFixed(2)),
        jumlahTransaksi: totals.count
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

exports.updateUserTransaksiTotal = async (email, newTotal) => {
    if (typeof newTotal !== 'number' || isNaN(newTotal)) {
        throw new Error('Invalid total amount');
    }

    const userAdjustedTotalRef = db.ref('userAdjustedTotals').child(email.replace('.', '_'));
    await userAdjustedTotalRef.set({
        adjustedTotal: Number(newTotal.toFixed(2)), 
        updatedAt: new Date().toISOString()
    });

    return { 
        email, 
        newTotal: Number(newTotal.toFixed(2))
    };
};