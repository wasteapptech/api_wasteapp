const express = require('express');
const router = express.Router();
const kegiatanController = require('../controllers/kegiatanController');

// Get all kegiatan
router.get('/', kegiatanController.getAllKegiatan);

// Get kegiatan by ID
router.get('/:id', kegiatanController.getKegiatanById);

// Create new kegiatan with image upload
router.post('/', kegiatanController.uploadImage, kegiatanController.createKegiatan);

// Update kegiatan with optional image upload
router.put('/:id', kegiatanController.uploadImage, kegiatanController.updateKegiatan);

// Delete kegiatan
router.delete('/:id', kegiatanController.deleteKegiatan);

module.exports = router;