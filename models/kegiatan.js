const mongoose = require("mongoose");

const kegiatanSchema = new mongoose.Schema(
    {
        nama: { type: String, required: true },
        tanggal: { type: String, required: true },
        deskripsi: { type: String, required: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Kegiatan", kegiatanSchema);
