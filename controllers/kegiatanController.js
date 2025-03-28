const Kegiatan = require("../models/kegiatan");

//  Tambah Kegiatan
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

//  Ambil Semua Kegiatan
exports.getKegiatan = async (req, res) => {
    try {
        const kegiatanList = await Kegiatan.find();
        res.json(kegiatanList);
    } catch (err) {
        res.status(500).json({ message: "Gagal mengambil kegiatan" });
    }
};

// Update Kegiatan
exports.updateKegiatan = async (req, res) => {
    const { id } = req.params;
    const { nama, tanggal, deskripsi } = req.body;

    try {
        const kegiatanUpdate = await Kegiatan.findByIdAndUpdate(
            id,
            { nama, tanggal, deskripsi },
            { new: true } // Mengembalikan data yang sudah diperbarui
        );

        if (!kegiatanUpdate) {
            return res.status(404).json({ message: "Kegiatan tidak ditemukan" });
        }

        res.json({ message: "Kegiatan berhasil diperbarui", kegiatan: kegiatanUpdate });
    } catch (err) {
        res.status(500).json({ message: "Gagal memperbarui kegiatan" });
    }
};

// Hapus Kegiatan
exports.hapusKegiatan = async (req, res) => {
    const { id } = req.params;

    try {
        const kegiatanHapus = await Kegiatan.findByIdAndDelete(id);

        if (!kegiatanHapus) {
            return res.status(404).json({ message: "Kegiatan tidak ditemukan" });
        }

        res.json({ message: "Kegiatan berhasil dihapus" });
    } catch (err) {
        res.status(500).json({ message: "Gagal menghapus kegiatan" });
    }
};
