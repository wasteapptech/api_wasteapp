const { db } = require('../config/firebase');

exports.createTransaksi = async (transaksiData) => {
    const transaksiRef = db.ref('transaksi');
    const newTransaksiRef = transaksiRef.push();
    
    // Calculate new transaction total from items
    const newTransactionTotal = transaksiData.items.reduce((sum, item) => 
        sum + (Number(item.subtotal) || 0), 0);

    // Get current adjusted total if exists
    const userAdjustedTotalRef = db.ref('userAdjustedTotals')
        .child(transaksiData.email.replace('.', '_'));
    const adjustedTotalSnapshot = await userAdjustedTotalRef.once('value');
    
    const currentAdjustedTotal = adjustedTotalSnapshot.exists() 
        ? adjustedTotalSnapshot.val().adjustedTotal 
        : 0;
    
    const newTotal = Number((currentAdjustedTotal + newTransactionTotal).toFixed(2));
    
    const timestamp = new Date().toISOString();
    const dataToSave = {
        ...transaksiData,
        createdAt: timestamp
    };
    
    // Update both transaction and adjusted total
    const updates = {
        [`/transaksi/${newTransaksiRef.key}`]: dataToSave,
        [`/userAdjustedTotals/${transaksiData.email.replace('.', '_')}`]: {
            adjustedTotal: newTotal,
            updatedAt: timestamp
        }
    };
    
    await db.ref().update(updates);

    return { 
        id: newTransaksiRef.key, 
        ...dataToSave,
        totalSemuaTransaksi: newTotal
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
    const userAdjustedTotalsRef = db.ref('userAdjustedTotals');
    const [transactionSnapshot, adjustedTotalsSnapshot] = await Promise.all([
        transaksiRef.once('value'),
        userAdjustedTotalsRef.once('value')
    ]);
    
    const transactionsByEmail = {};
    
    transactionSnapshot.forEach((childSnapshot) => {
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
        const adjustedTotal = adjustedTotalsSnapshot.child(email.replace('.', '_')).exists() 
            ? adjustedTotalsSnapshot.child(email.replace('.', '_')).val().adjustedTotal
            : userTotals.total;

        results.push({
            id: userTotals.lastTransaction.id,
            createdAt: userTotals.lastTransaction.createdAt,
            email: userTotals.lastTransaction.email,
            username: userTotals.lastTransaction.username,
            totalSemuaTransaksi: adjustedTotal,
            jumlahTransaksi: userTotals.count
        });
    }

    return results;
};

exports.getTransaksiByUser = async (email) => {
    const totals = await exports.calculateTransactionTotals(email);
    const userAdjustedTotalRef = db.ref('userAdjustedTotals').child(email.replace('.', '_'));
    const adjustedTotalSnapshot = await userAdjustedTotalRef.once('value');
    
    const adjustedTotal = adjustedTotalSnapshot.exists() 
        ? adjustedTotalSnapshot.val().adjustedTotal 
        : totals.total;

    return {
        transaksi: totals.transactions,
        totalSemuaTransaksi: adjustedTotal,
        jumlahTransaksi: totals.count
    };
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
        totalSemuaTransaksi: formattedTotal
    };
};

// Remove or comment out getUserBalance and updateUserBalance if not needed
// ...rest of existing code...