const express = require('express');
const router = express.Router();
const kegiatanController = require('../controllers/kegiatanController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Gunakan middleware ini di route Anda
router.post('/', upload.single('gambar'), kegiatanController.createKegiatan);
// Get semua kegiatan
router.get('/', kegiatanController.getAllKegiatan);

// Get kegiatan by ID
router.get('/:id', kegiatanController.getKegiatanById);

// Update kegiatan
router.put('/:id', kegiatanController.updateKegiatan);

// Delete kegiatan
router.delete('/:id', kegiatanController.deleteKegiatan);

module.exports = router;