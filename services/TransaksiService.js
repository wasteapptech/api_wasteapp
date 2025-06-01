const { db } = require('../config/firebase');

exports.createTransaksi = async (transaksiData) => {
    const transaksiRef = db.ref('transaksi');
    const newTransaksiRef = transaksiRef.push();
    
    // Calculate new transaction total from items
    const newTransactionTotal = transaksiData.items.reduce((sum, item) => 
        sum + (Number(item.subtotal) || 0), 0);

    // Get current user totals
    const userTotals = await exports.calculateTransactionTotals(transaksiData.email);
    const userAdjustedTotalRef = db.ref('userAdjustedTotals')
        .child(transaksiData.email.replace('.', '_'));
    const adjustedTotalSnapshot = await userAdjustedTotalRef.once('value');
    
    // Calculate new total
    const currentAdjustedTotal = adjustedTotalSnapshot.exists() 
        ? adjustedTotalSnapshot.val().adjustedTotal 
        : userTotals.total;
    const newAdjustedTotal = Number((currentAdjustedTotal + newTransactionTotal).toFixed(2));
    
    // Save new transaction
    const timestamp = new Date().toISOString();
    const dataToSave = {
        ...transaksiData,
        createdAt: timestamp
    };
    
    // Update both transaction and adjusted total atomically
    const updates = {
        [`/transaksi/${newTransaksiRef.key}`]: dataToSave,
        [`/userAdjustedTotals/${transaksiData.email.replace('.', '_')}`]: {
            adjustedTotal: newAdjustedTotal,
            updatedAt: timestamp
        }
    };
    
    await db.ref().update(updates);

    return { 
        id: newTransaksiRef.key, 
        ...dataToSave,
        totalSemuaTransaksi: userTotals.total + newTransactionTotal,
        balanceNow: newAdjustedTotal
    };
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
    let totalFromItems = 0;

    snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        // Calculate total for each transaction from its items
        const transactionItemsTotal = data.items.reduce((sum, item) => {
            // Ensure we're using valid numbers
            const itemSubtotal = Number(item.subtotal) || 0;
            return sum + itemSubtotal;
        }, 0);
        
        // Add transaction with calculated total
        transactions.push({
            id: childSnapshot.key,
            ...data,
            calculatedTotal: transactionItemsTotal
        });
        
        // Add to running total
        totalFromItems += transactionItemsTotal;
    });

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
        transactions,
        total: Number(totalFromItems.toFixed(2)), // Ensure clean number
        count: transactions.length,
        lastTransaction: transactions[0]
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
        const userAdjustedTotalRef = db.ref('userAdjustedTotals').child(email.replace('.', '_'));
        const adjustedTotalSnapshot = await userAdjustedTotalRef.once('value');
        const adjustedTotal = adjustedTotalSnapshot.exists() ? 
            adjustedTotalSnapshot.val().adjustedTotal : 
            userTotals.total;
        
        results.push({
            id: userTotals.lastTransaction.id,
            createdAt: userTotals.lastTransaction.createdAt,
            email: userTotals.lastTransaction.email,
            username: userTotals.lastTransaction.username,
            totalSemuaTransaksi: userTotals.total,
            balanceNow: adjustedTotal,
            jumlahTransaksi: userTotals.count
        });
    }

    return results;
};

exports.getTransaksiByUser = async (email) => {
    const totals = await exports.calculateTransactionTotals(email);
    const userAdjustedTotalRef = db.ref('userAdjustedTotals').child(email.replace('.', '_'));
    const adjustedTotalSnapshot = await userAdjustedTotalRef.once('value');
    
    const adjustedTotal = adjustedTotalSnapshot.exists() ? 
        adjustedTotalSnapshot.val().adjustedTotal : 
        totals.total;

    return {
        transaksi: totals.transactions,
        totalSemuaTransaksi: totals.total,
        balanceNow: adjustedTotal,
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
    const formattedTotal = Number(newTotal.toFixed(2));
    
    await userAdjustedTotalRef.set({
        adjustedTotal: formattedTotal,
        updatedAt: new Date().toISOString()
    });

    return { 
        email, 
        newTotal: formattedTotal,
        balanceNow: formattedTotal
    };
};