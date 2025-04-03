const cloudinary = require('cloudinary').v2;
const kegiatanService = require('../services/kegiatanService');
const notificationService = require('../services/notificationService');




// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Tambah kegiatan baru dengan upload gambar
exports.createKegiatan = async (req, res) => {
  try {
    const { judul, deskripsi, tanggal } = req.body;
    const file = req.file; // File sudah dalam memory buffer

    if (!judul || !deskripsi || !tanggal) {
      return res.status(400).json({ error: 'Judul, deskripsi, dan tanggal diperlukan' });
    }

    let gambarUrl = null;

    if (file) {
      try {
        // Convert buffer ke format yang bisa diupload ke Cloudinary
        const uploadStr = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        
        const uploadedResponse = await cloudinary.uploader.upload(uploadStr, {
          folder: 'kegiatan-images',
          resource_type: 'auto'
        });
        
        gambarUrl = uploadedResponse.secure_url;
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ 
          error: 'Gagal mengupload gambar ke Cloudinary',
          details: uploadError.message
        });
      }
    }

    const newKegiatan = { 
      judul, 
      deskripsi, 
      tanggal,
      gambar: gambarUrl,
      createdAt: new Date().toISOString()
    };

    const result = await kegiatanService.createKegiatan(newKegiatan);
    
    await notificationService.sendNotificationToAllDevices(
      'Kegiatan baru dari komunitas', 
      `${judul}\n${deskripsi}`,
      gambarUrl
    );

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating kegiatan:', error);
    res.status(500).json({ 
      error: 'Gagal menambahkan kegiatan',
      details: error.message 
    });
  }
};

// Get semua kegiatan
exports.getAllKegiatan = async (req, res) => {
  try {
    let kegiatanArray = await kegiatanService.getAllKegiatan();

    // Urutkan berdasarkan createdAt terbaru
    kegiatanArray.sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json(kegiatanArray);
  } catch (error) {
    console.error('Error fetching kegiatan:', error);
    res.status(500).json({ error: 'Gagal memuat kegiatan' });
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