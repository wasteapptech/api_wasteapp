const hargaService = require('../services/HargaService');

exports.getHarga = async (req, res) => {
    try {
        const harga = await hargaService.getHarga();
        res.status(200).json(harga);
    } catch (error) {
        console.error('Error fetching harga:', error);
        res.status(500).json({ error: 'Gagal memuat harga' });
    }
};

exports.updateHarga = async (req, res) => {
    try {
        const newHarga = req.body;
        const updatedHarga = await hargaService.updateHarga(newHarga);
        res.status(200).json(updatedHarga);
    } catch (error) {
        console.error('Error updating harga:', error);
        res.status(500).json({ error: 'Gagal mengupdate harga' });
    }
};