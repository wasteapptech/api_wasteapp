
const Kegiatan = require("../models/kegiatan");

exports.tambahKegiatan = async (req, res) => {
    const { nama, tanggal, deskripsi } = req.body;
    try {
        const kegiatanBaru = new Kegiatan({ nama, tanggal, deskripsi });
        await kegiatanBaru.save();
        res.status(201).json({ message: "Kegiatan berhasil ditambahkan", kegiatan: kegiatanBaru });
    } catch (err) {
        res.status(500).json({ message: "Gagal menambahkan kegiatan" });
    }
};

exports.getKegiatan = async (req, res) => {
    try {
        const kegiatanList = await Kegiatan.find();
        res.json(kegiatanList);
    } catch (err) {
        res.status(500).json({ message: "Gagal mengambil kegiatan" });
    }
};
