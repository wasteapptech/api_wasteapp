const transaksiService = require('../services/TransaksiService');
const hargaService = require('../services/HargaService');

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
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating transaksi:', error);
        res.status(500).json({ error: 'Gagal membuat transaksi' });
    }
};

exports.getAllTransaksi = async (req, res) => {
    try {
        const transaksi = await transaksiService.getAllTransaksi();
        res.status(200).json(transaksi);
    } catch (error) {
        console.error('Error fetching transaksi:', error);
        res.status(500).json({ error: 'Gagal memuat transaksi' });
    }
};

exports.getTransaksiByUser = async (req, res) => {
    try {
        const { email } = req.params;
        const transaksi = await transaksiService.getTransaksiByUser(email);
        res.status(200).json(transaksi);
    } catch (error) {
        console.error('Error fetching user transaksi:', error);
        res.status(500).json({ error: 'Gagal memuat transaksi pengguna' });
    }
};