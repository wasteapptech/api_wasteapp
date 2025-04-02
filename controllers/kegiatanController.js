const kegiatanService = require('../services/kegiatanService');
const notificationService = require('../services/notificationService');

// Get semua kegiatan
exports.getAllKegiatan = async () => {
  try {
    const snapshot = await db.collection('kegiatan')
      .orderBy('tanggal', 'desc') 
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw error;
  }
};

// Get kegiatan by ID
exports.getKegiatanById = async (req, res) => {
  try {
    const { id } = req.params;
    const kegiatan = await kegiatanService.getKegiatanById(id);
    
    if (!kegiatan) {
      return res.status(404).json({ error: 'Kegiatan tidak ditemukan' });
    }
    
    res.status(200).json(kegiatan);
  } catch (error) {
    console.error('Error fetching kegiatan by ID:', error);
    res.status(500).json({ error: 'Gagal memuat kegiatan' });
  }
};

// Tambah kegiatan baru
exports.createKegiatan = async (req, res) => {
  try {
    const { judul, deskripsi, tanggal } = req.body;

    // Validasi data
    if (!judul || !deskripsi || !tanggal) {
      return res.status(400).json({ error: 'Judul, deskripsi, dan tanggal diperlukan' });
    }

    // Pastikan format tanggal valid (opsional)
    if (isNaN(Date.parse(tanggal))) {
      return res.status(400).json({ error: 'Format tanggal tidak valid' });
    }

    // Simpan ke Firebase
    const newKegiatan = { judul, deskripsi, tanggal };
    const result = await kegiatanService.createKegiatan(newKegiatan);

    // Kirim notifikasi ke semua device terdaftar
    await notificationService.sendNotificationToAllDevices(
      'Kegiatan Baru', 
      `${judul} - ${tanggal}`
    );

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating kegiatan:', error);
    res.status(500).json({ error: 'Gagal menambahkan kegiatan' });
  }
};


// Update kegiatan
exports.updateKegiatan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const result = await kegiatanService.updateKegiatan(id, updateData);
    
    if (!result) {
      return res.status(404).json({ error: 'Kegiatan tidak ditemukan' });
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error updating kegiatan:', error);
    res.status(500).json({ error: 'Gagal mengupdate kegiatan' });
  }
};

// Delete kegiatan
exports.deleteKegiatan = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await kegiatanService.deleteKegiatan(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Kegiatan tidak ditemukan' });
    }
    
    res.status(200).json({ success: true, message: 'Kegiatan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting kegiatan:', error);
    res.status(500).json({ error: 'Gagal menghapus kegiatan' });
  }
};