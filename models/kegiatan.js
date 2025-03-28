const mongoose = require("mongoose");

const KegiatanSchema = new mongoose.Schema({
    nama: { type: String, required: true },
    tanggal: { type: String, required: true },
    deskripsi: { type: String, required: true }
});

module.exports = mongoose.model("Kegiatan", KegiatanSchema);
