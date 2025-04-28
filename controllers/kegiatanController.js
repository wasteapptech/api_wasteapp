const kegiatanService = require('../services/kegiatanService');
const notificationService = require('../services/notificationService');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ storage: multer.memoryStorage() });
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

exports.uploadImage = upload.single('gambar');

// Get semua kegiatan
exports.getAllKegiatan = async (req, res) => {
  try {
    let kegiatanArray = await kegiatanService.getAllKegiatan();
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

// Tambah kegiatan baru dengan gambar
exports.createKegiatan = async (req, res) => {
  try {
    const { judul, deskripsi, tanggal } = req.body;

    if (!judul || !deskripsi || !tanggal) {
      return res.status(400).json({ error: 'Judul, deskripsi, dan tanggal diperlukan' });
    }
    const newKegiatan = { judul, deskripsi, tanggal };
    
    // Upload gambar ke Cloudinary jika ada
    if (req.file) {
      try {
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer);
        newKegiatan.gambarUrl = cloudinaryResult.secure_url;
        newKegiatan.gambarPublicId = cloudinaryResult.public_id;
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ error: 'Gagal mengupload gambar' });
      }
    }

    const result = await kegiatanService.createKegiatan(newKegiatan);
    await notificationService.sendNotificationToAllDevices(
      'Kegiatan Baru Komunitas', 
      `${judul}\n${deskripsi}`,
      newKegiatan.gambarUrl 
    );

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating kegiatan:', error);
    res.status(500).json({ error: 'Gagal menambahkan kegiatan' });
  }
};

// Update kegiatan dengan opsi update gambar
exports.updateKegiatan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Periksa apakah kegiatan ada sebelum update
    const existingKegiatan = await kegiatanService.getKegiatanById(id);
    if (!existingKegiatan) {
      return res.status(404).json({ error: 'Kegiatan tidak ditemukan' });
    }
    
    // Upload gambar baru ke Cloudinary jika ada
    if (req.file) {
      try {
        // Hapus gambar lama jika ada
        if (existingKegiatan.gambarPublicId) {
          await cloudinary.uploader.destroy(existingKegiatan.gambarPublicId);
        }
        
        // Upload gambar baru
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer);
        updateData.gambarUrl = cloudinaryResult.secure_url;
        updateData.gambarPublicId = cloudinaryResult.public_id;
      } catch (uploadError) {
        console.error('Error updating image on Cloudinary:', uploadError);
        return res.status(500).json({ error: 'Gagal mengupdate gambar' });
      }
    }
    
    const result = await kegiatanService.updateKegiatan(id, updateData);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error updating kegiatan:', error);
    res.status(500).json({ error: 'Gagal mengupdate kegiatan' });
  }
};

// Delete kegiatan termasuk gambar di Cloudinary
exports.deleteKegiatan = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Dapatkan data kegiatan untuk mendapatkan public_id gambar
    const kegiatan = await kegiatanService.getKegiatanById(id);
    
    if (!kegiatan) {
      return res.status(404).json({ error: 'Kegiatan tidak ditemukan' });
    }
    
    // Hapus gambar dari Cloudinary jika ada
    if (kegiatan.gambarPublicId) {
      try {
        await cloudinary.uploader.destroy(kegiatan.gambarPublicId);
      } catch (deleteError) {
        console.error('Error deleting image from Cloudinary:', deleteError);
        // Lanjutkan proses meski gagal menghapus gambar
      }
    }
    
    // Hapus data kegiatan dari Firebase
    const success = await kegiatanService.deleteKegiatan(id);
    
    res.status(200).json({ success: true, message: 'Kegiatan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting kegiatan:', error);
    res.status(500).json({ error: 'Gagal menghapus kegiatan' });
  }
};