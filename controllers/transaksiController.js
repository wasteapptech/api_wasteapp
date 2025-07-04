const transaksiService = require('../services/TransaksiService');
const hargaService = require('../services/HargaService');
const { db } = require('../config/firebase');
const { formatTimestamp } = require('../utils/datetimeHelper');

exports.createTransaksi = async (req, res) => {
    try {
        const { email, username, items } = req.body;

        if (!email || !username || !items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Data tidak lengkap' });
        }

        // Get current prices
        const harga = await hargaService.getHarga();
        
        // Calculate total
        let totalTransaksi = 0;
        const itemsWithPrice = items.map(item => {
            const hargaItem = harga[item.nama.toLowerCase()] || 0;
            const subtotal = hargaItem * item.jumlah;
            totalTransaksi += subtotal;
            
            return {
                ...item,
                hargaSatuan: hargaItem,
                subtotal: subtotal
            };
        });

        const transaksiData = {
            email,
            username,
            items: itemsWithPrice,
            totalTransaksi,
            createdAt: new Date().toISOString()
        };

        const result = await transaksiService.createTransaksi(transaksiData);
        
        res.status(201).json({
            ...result,
            message: 'Transaksi berhasil dibuat dan total diperbarui'
        });
    } catch (error) {
        console.error('Error creating transaksi:', error);
        res.status(500).json({ error: 'Gagal membuat transaksi' });
    }
};

exports.getAllTransaksi = async (req, res) => {
    try {
        const results = await transaksiService.getAllTransaksi();
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching transaksi:', error);
        res.status(500).json({ error: 'Gagal memuat transaksi' });
    }
};

exports.getTransaksiByUser = async (req, res) => {
    try {
        const { email } = req.params;
        if (!email) {
            return res.status(400).json({ error: 'Email parameter is required' });
        }
        const profilesRef = db.ref('profiles');
        const profileSnapshot = await profilesRef.orderByChild('email').equalTo(email).once('value');
        
        if (!profileSnapshot.exists()) {
            return res.status(404).json({ error: 'User profile not found' });
        }

        const profileData = profileSnapshot.val();
        const userProfile = Object.values(profileData)[0];

        const transactionData = await transaksiService.getTransaksiByUser(email);

        const response = {
            userInfo: {
                name: userProfile.name,
                email: userProfile.email,
                avatarUrl: userProfile.avatarUrl || null
            },
            transactionSummary: {
                totalTransactions: transactionData.jumlahTransaksi,
                totalSemuaTransaksi: transactionData.totalSemuaTransaksi
            },
            transactions: transactionData.transaksi
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Get transactions by user error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions', details: error.message });
    }
};

exports.updateUserBalance = async (req, res) => {
    try {
        const { email } = req.params;
        const { newBalance } = req.body;

        if (typeof newBalance !== 'number') {
            return res.status(400).json({ error: 'Balance harus berupa angka' });
        }

        const result = await transaksiService.updateUserBalance(email, newBalance);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error updating user balance:', error);
        res.status(500).json({ error: 'Gagal mengupdate saldo pengguna' });
    }
};

exports.updateTotalTransaksi = async (req, res) => {
    try {
        const { email } = req.params;
        const { balance } = req.body; 

        if (typeof balance !== 'number' || isNaN(balance)) {
            return res.status(400).json({ error: 'Balance harus berupa angka yang valid' });
        }

        const result = await transaksiService.getTransaksiByUser(email);
        const currentTotal = result.totalSemuaTransaksi;

        if (balance > currentTotal) {
            return res.status(400).json({ 
                error: 'Balance tidak boleh lebih besar dari total transaksi'
            });
        }

        const updatedTotal = Number((currentTotal - balance).toFixed(2));

        if (isNaN(updatedTotal) || updatedTotal < 0) {
            return res.status(400).json({ 
                error: 'Perhitungan total tidak valid'
            });
        }

        const updateResult = await transaksiService.updateUserTransaksiTotal(email, updatedTotal);
        res.status(200).json({
            email,
            previousTotal: currentTotal,
            balanceWithdrawn: balance,
            remainingTotal: updatedTotal
        });
    } catch (error) {
        console.error('Error updating total transaksi:', error);
        res.status(500).json({ 
            error: 'Gagal mengupdate total transaksi',
            message: error.message 
        });
    }
};