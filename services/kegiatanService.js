const { db, admin } = require('../config/firebase');

// Get semua kegiatan
exports.getAllKegiatan = async () => {
    const snapshot = await db.ref('kegiatan').once('value');
    const data = snapshot.val();

    // Transform data dari object ke array
    const kegiatanArray = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key]
    })) : [];

    return kegiatanArray;
};

// Get kegiatan by ID
exports.getKegiatanById = async (id) => {
    const snapshot = await db.ref(`kegiatan/${id}`).once('value');
    const data = snapshot.val();

    if (!data) {
        return null;
    }

    return {
        id: snapshot.key,
        ...data
    };
};

// Tambah kegiatan baru
exports.createKegiatan = async (kegiatanData) => {
    // Tambahkan timestamp
    kegiatanData.createdAt = admin.database.ServerValue.TIMESTAMP;

    // Simpan ke Firebase
    const kegiatanRef = db.ref('kegiatan').push();
    await kegiatanRef.set(kegiatanData);

    return {
        id: kegiatanRef.key,
        ...kegiatanData
    };
};

// Update kegiatan
exports.updateKegiatan = async (id, updateData) => {
    // Periksa apakah kegiatan ada
    const snapshot = await db.ref(`kegiatan/${id}`).once('value');

    if (!snapshot.exists()) {
        return null;
    }

    // Tambahkan timestamp update
    updateData.updatedAt = admin.database.ServerValue.TIMESTAMP;

    // Update data
    await db.ref(`kegiatan/${id}`).update(updateData);

    // Ambil data terbaru
    const updatedSnapshot = await db.ref(`kegiatan/${id}`).once('value');

    return {
        id: updatedSnapshot.key,
        ...updatedSnapshot.val()
    };
};

// Delete kegiatan
exports.deleteKegiatan = async (id) => {
    // Periksa apakah kegiatan ada
    const snapshot = await db.ref(`kegiatan/${id}`).once('value');

    if (!snapshot.exists()) {
        return false;
    }

    // Hapus data
    await db.ref(`kegiatan/${id}`).remove();

    return true;
};