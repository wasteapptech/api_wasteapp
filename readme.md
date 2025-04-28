# wasteapp

Api WasteApp project for Final Capstone Project Telecommunication Engineering 21

Judul : Optimalisasi aplikasi bank sampah dan perancangan tempat sampah berbasil IOT

config/
  └── firebase.js             # Konfigurasi koneksi ke Firebase
controllers/
  ├── adminController.js       # Logika untuk fitur admin
  ├── authController.js        # Logika untuk autentikasi pengguna (login, register, dll)
  ├── kegiatanController.js    # Logika untuk fitur kegiatan/event
  ├── newsController.js        # Logika untuk berita atau informasi
  ├── notificationController.js# Logika untuk mengelola notifikasi
  ├── surveyController.js      # Logika untuk survey pengguna
  └── userController.js        # Logika untuk manajemen data pengguna
routes/
  ├── admin.js                 # Routing endpoint untuk admin
  ├── auth.js                  # Routing endpoint untuk autentikasi
  ├── kegiatan.js              # Routing endpoint untuk kegiatan/event
  ├── news.js                  # Routing endpoint untuk berita
  ├── notification.js          # Routing endpoint untuk notifikasi
  ├── survey.js                # Routing endpoint untuk survey
  └── user.js                  # Routing endpoint untuk user
services/
  ├── kegiatanService.js       # Service untuk pengolahan data kegiatan
  ├── newsService.js            # Service untuk pengolahan data berita
  └── notificationService.js   # Service untuk pengolahan data notifikasi
utils/
  ├── authHelper.js             # Helper untuk fungsi-fungsi autentikasi tambahan
  ├── cronJobs.js               # Penjadwalan otomatis (misal: kirim notifikasi berkala)
  └── datetimeHelper.js         # Helper untuk manipulasi waktu dan tanggal
node_modules/                   # Dependensi project (folder otomatis dari npm install)
.env                             # File environment variable (secrets, API keys, dsb)
.gitignore                       # File untuk menentukan file/folder yang tidak di-push ke Git
index.js                         # Entry point utama API (server start dari sini)
package.json                     # Konfigurasi npm project (nama, dependensi, scripts)
package-lock.json                # Lockfile versi package untuk konsistensi instalasi
readme.md                        # Dokumentasi project
vercel.json                      # Konfigurasi untuk deployment ke Vercel
