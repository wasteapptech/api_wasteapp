const express = require('express');
const router = express.Router();
const kegiatanController = require('../controllers/kegiatanController');

// Get semua kegiatan
router.get('/', kegiatanController.getAllKegiatan);

// Tambah kegiatan baru
router.post('/', kegiatanController.createKegiatan);

// Get kegiatan by ID
router.get('/:id', kegiatanController.getKegiatanById);

// Update kegiatan
router.put('/:id', kegiatanController.updateKegiatan);

// Delete kegiatan
router.delete('/:id', kegiatanController.deleteKegiatan);

module.exports = router;