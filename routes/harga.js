const express = require('express');
const router = express.Router();
const hargaController = require('../controllers/hargaController');

// Get current harga
router.get('/', hargaController.getHarga);

// Update harga
router.put('/', hargaController.updateHarga);

module.exports = router;