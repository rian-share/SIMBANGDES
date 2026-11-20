# Product Requirements Document (PRD)
## SIMBANGDES — Sistem Informasi Manajemen Pembangunan dan Transparansi Desa

| Atribut Dokumen | Keterangan |
| :--- | :--- |
| **Nama Produk** | SIMBANGDES (Sistem Informasi Manajemen Pembangunan dan Transparansi Desa) |
| **Versi Dokumen** | 1.1 (Modular Documentation Baseline) |
| **Status** | Approved for Development |
| **Dokumen Pendamping** | • `TECH-STACK.md` — Tumpukan teknologi, pustaka, dan standar UI<br>• `DATABASE.md` — Skema 8 tabel relasional, ERD, dan migrasi<br>• `ARCHITECTURE.md` — Arsitektur *Monolith-Hybrid*, struktur folder, dan keamanan<br>• `BUSINESS-RULES.md` — Logika kalkulasi, *state machine*, dan validasi domain |

## 1. Ringkasan Eksekutif & Latar Belakang Masalah

### 1.1 Latar Belakang
Pengelolaan proyek pembangunan fisik dan infrastruktur di tingkat desa secara konvensional masih bergantung pada pencatatan manual dan pelaporan melalui aplikasi pesan singkat. Kondisi ini menimbulkan empat permasalahan utama:
1. **Ketidaksesuaian Anggaran vs. Realisasi:** Sulitnya memantau selisih antara pagu anggaran dengan pengeluaran riil secara akurat dan tepat waktu.
2. **Keterlambatan Proyek Tanpa Deteksi Dini:** Tidak adanya mekanisme peringatan otomatis ketika progres fisik di lapangan tertinggal dari jadwal target.
3. **Dokumentasi Lapangan Berserakan:** Bukti foto pekerjaan (sebelum, saat, dan sesudah pengerjaan) tidak terstruktur sehingga memperlambat proses verifikasi oleh aparat desa.
4. **Minimnya Transparansi Publik:** Masyarakat desa kesulitan mengakses informasi status pembangunan, serapan dana desa, dan saluran pengaduan yang terpantau tindak lanjutnya.

### 1.2 Solusi Produk
**SIMBANGDES** adalah aplikasi web responsif berbasis arsitektur *monolith-hybrid* yang mengintegrasikan manajemen proyek desa, pencatatan realisasi anggaran, pemantauan risiko keterlambatan, verifikasi laporan bertahap, serta portal transparansi publik dilengkapi peta interaktif dan sistem tiket pengaduan masyarakat.

---

## 2. Tujuan Produk & Metrik Keberhasilan (KPI)

| Tujuan Utama | Indikator Keberhasilan (KPI) | Target |
| :--- | :--- | :--- |
| **Sentralisasi Data Proyek & Anggaran** | Seluruh proyek fisik desa dan transaksi pengeluarannya tercatat dalam satu basis data terpusat. | 100% proyek aktif terdata |
| **Deteksi Dini Keterlambatan** | Sistem otomatis menandai status risiko proyek berdasarkan perbandingan progres aktual vs. target waktu. | Akurasi kalkulasi 100% |
| **Efisiensi Pelaporan & Verifikasi** | Pelaksana mengunggah laporan + 3 tahap foto dan Pemdes memverifikasi/mengembalikan dalam satu alur digital. | Waktu siklus verifikasi < 24 jam |
| **Keterbukaan Informasi Publik** | Masyarakat dapat melihat profil proyek, lokasi pada peta, serapan anggaran, dan mengirim pengaduan tanpa akun. | Akses publik < 3 detik muat halaman |

---

## 3. Ruang Lingkup Produk (*Scope*)

### 3.1 Termasuk dalam Ruang Lingkup (*In-Scope*)
* Aplikasi web responsif (desktop & mobile browser) dengan pengalaman *Single Page Application* (SPA).
* Manajemen akun pengguna berbasis 3 peran statis terautentikasi (`admin`, `pemdes`, `pelaksana`) serta akses publik tanpa *login* (`guest` / masyarakat).
* Manajemen proyek pembangunan desa, alokasi pagu anggaran, dan pencatatan transaksi pengeluaran.
* Pemantauan progres fisik vs. target jadwal dengan indikator status risiko keterlambatan.
* Pelaporan progres lapangan oleh pelaksana beserta unggah dokumentasi foto 3 tahap (*Sebelum*, *Saat*, *Sesudah*).
* Alur verifikasi laporan oleh Pemerintah Desa (*Setujui* atau *Kembalikan dengan Catatan Revisi*).
* Ekspor laporan pertanggungjawaban proyek dan realisasi anggaran ke format PDF.
* Portal Transparansi Publik (ringkasan statistik, daftar proyek, detail proyek, peta interaktif berbasis koordinat GIS, transparansi anggaran, formulir pengaduan bertiket, **Statistik Pembangunan, Berita & Pengumuman (dikelola Pemdes), serta Galeri & Dokumentasi**).
* Pencatatan log aktivitas sistem (*Audit Trail*) yang bersifat *read-only* dan pencadangan basis data (*Backup*).

### 3.2 Di Luar Ruang Lingkup (*Out-of-Scope*)
* Tidak membangun aplikasi *mobile native* Android (`.apk`) maupun iOS (`.ipa`).
* Tidak menangani administrasi kependudukan (KTP/KK), persuratan umum, maupun penyaluran bantuan sosial (BLT/Bansos).
* Tidak menyediakan fitur *payment gateway* atau transfer dana perbankan secara langsung.
* Tidak melakukan integrasi API atau sinkronisasi otomatis dengan sistem eksternal pemerintah (seperti SISKEUDES, SIPD, atau server Kemendagri).
* Tidak menyediakan antarmuka untuk membuat atau mengubah struktur *role* baru secara dinamis (peran dikunci di dalam kode sistem).

---

## 4. Persona Pengguna & Matriks Hak Akses (RBAC)

| Aktor / Peran | Kode Role | Autentikasi | Tanggung Jawab & Hak Akses Utama |
| :--- | :--- | :--- | :--- |
| **Pemerintah Desa (Pemdes)** | `pemdes` | Wajib Login | Mengelola data proyek & pagu anggaran, mencatat transaksi pengeluaran, memantau progres & analisis risiko, memverifikasi/mengembalikan laporan progres, menindaklanjuti pengaduan warga, mengekspor laporan PDF, mengelola profil. |
| **Pelaksana Proyek (TPK/Kontraktor)** | `pelaksana` | Wajib Login | Melihat proyek yang ditugaskan (*read-only* pada anggaran, tenggat, dan target), menginput pembaruan progres fisik, mengunggah dokumentasi foto 3 tahap, memperbaiki laporan yang dikembalikan, mengelola profil. |
| **Admin Sistem** | `admin` | Wajib Login | Mengelola akun pengguna (tambah, ubah, nonaktifkan, reset kata sandi, tetapkan *role*), memantau aktivitas *login* & sesi aktif, memeriksa *Audit Trail* (*read-only*), menjalankan *backup* database, mengelola profil. |
| **Masyarakat Desa (Publik)** | `guest` | Tanpa Login | Melihat beranda transparansi, daftar & detail proyek publik, peta sebaran proyek, grafik & rincian anggaran, serta mengirim pengaduan masyarakat dan melacak status menggunakan kode tiket. |

---

## 5. Spesifikasi Kebutuhan Fungsional

### FR-01: Autentikasi, Manajemen Pengguna & Audit Trail
* **Deskripsi:** Mengamankan akses internal menggunakan autentikasi berbasis sesi dan mencatat seluruh perubahan data penting secara permanen.
* **Acceptance Criteria:**
  * Pengguna internal dapat *login* menggunakan `email` atau `username` dan `password`.
  * Sistem menerapkan pembatasan percobaan *login* (*Rate Limiting / Throttle*).
  * Admin Sistem dapat membuat akun baru, mengubah data, menonaktifkan akun, dan mereset kata sandi, tetapi tidak dapat membuat *role* baru di luar `admin`, `pemdes`, dan `pelaksana`.
  * Setiap aksi *Login*, *Logout*, *Create*, *Update*, dan *Delete* otomatis tercatat ke dalam *Audit Trail* yang bersifat *read-only*.

### FR-02: Dashboard Eksekutif & Statistik Peran
* **Deskripsi:** Menampilkan ringkasan metrik operasional sesuai hak akses pengguna segera setelah *login*.
* **Acceptance Criteria:**
  * **Dashboard Pemdes:** Menampilkan kartu ringkasan (Total Proyek, Berjalan, Selesai, Terlambat, Total Pagu, Total Realisasi, Sisa Anggaran), grafik serapan anggaran, daftar laporan menunggu verifikasi, dan peringatan proyek berisiko.
  * **Dashboard Pelaksana:** Menampilkan daftar proyek yang ditugaskan kepadanya, progres terakhir masing-masing proyek, serta status laporan (Menunggu Verifikasi / Ditolak & Perlu Revisi).
  * **Dashboard Admin:** Menampilkan jumlah total pengguna, pengguna aktif, sesi yang sedang berjalan, serta ringkasan log aktivitas terbaru.

### FR-03: Manajemen Proyek & Alokasi Anggaran
* **Deskripsi:** Pengelolaan siklus hidup data proyek pembangunan desa beserta perencanaan dan realisasi biayanya.
* **Acceptance Criteria:**
  * Pemdes dapat menambah, mengubah, dan menghapus data proyek (nama proyek, kategori/jenis, lokasi, koordinat `latitude` & `longitude`, pelaksana yang ditugaskan, tanggal mulai, tenggat waktu, target progres, status visibilitas publik, dan deskripsi).
  * Pemdes dapat menetapkan pagu anggaran dan sumber dana pada setiap proyek.
  * Pemdes dapat mencatat transaksi pengeluaran (tanggal, kategori belanja, uraian pengeluaran, nominal, dan unggah bukti nota/kwitansi).
  * Sistem otomatis menghitung `total_realisasi` dan `sisa_anggaran` dengan presisi 2 digit desimal dalam waktu < 1 detik.

### FR-04: Monitoring Progres, Deteksi Risiko & Verifikasi Laporan
* **Deskripsi:** Pemantauan deviasi jadwal dan proses persetujuan berjenjang atas laporan lapangan.
* **Acceptance Criteria:**
  * Sistem membandingkan persentase progres fisik aktual terhadap target jadwal berjalan dan menandai status risiko proyek: **Hijau (Sesuai Target)**, **Kuning (Waspada Deviasi)**, atau **Merah (Kritis / Terlambat)**.
  * Pemdes dapat memeriksa rincian laporan progres dan foto yang dikirim oleh Pelaksana.
  * Pemdes dapat memilih **Setujui** (yang otomatis memperbarui progres resmi proyek) atau **Kembalikan / Tolak** dengan wajib mengisi `catatan_revisi`.

### FR-05: Tindak Lanjut Pengaduan & Ekspor Laporan PDF
* **Deskripsi:** Pengelolaan respons atas aspirasi masyarakat serta pembuatan dokumen pertanggungjawaban resmi.
* **Acceptance Criteria:**
  * Pemdes dapat melihat daftar pengaduan masuk beserta foto bukti dan lokasi, mengubah status (`Menunggu`, `Diproses`, `Selesai`, `Ditolak`), serta menuliskan tanggapan resmi yang dapat dilihat warga melalui kode tiket.
  * Pemdes dapat mengekspor rekapitulasi laporan proyek dan realisasi anggaran menjadi berkas PDF siap cetak dalam waktu < 5 detik.

### FR-06: Pelaksanaan & Pelaporan Progres Lapangan
* **Deskripsi:** Antarmuka khusus Pelaksana Proyek untuk melaporkan perkembangan fisik di lapangan.
* **Acceptance Criteria:**
  * Pelaksana hanya melihat proyek yang ditugaskan kepadanya; rincian anggaran, target utama, dan tenggat waktu tampil dalam mode *read-only*.
  * Pelaksana dapat mengirim laporan progres berkala berisi tanggal laporan, persentase fisik (`0.00` s.d. `100.00`), keterangan pekerjaan, dan kendala lapangan.
  * Pelaksana dapat mengunggah dokumentasi foto yang dikelompokkan berdasarkan 3 tahap wajib: **Sebelum**, **Saat**, dan **Sesudah** pengerjaan (maksimal 5 MB per foto).
  * Jika laporan berstatus **Ditolak/Dikembalikan**, Pelaksana menerima catatan revisi, dapat memperbarui data/foto laporan tersebut, dan mengirimkannya kembali.

### FR-07: Portal Transparansi Publik & Kanal Pengaduan Masyarakat
* **Deskripsi:** Halaman depan publik untuk keterbukaan informasi pembangunan desa tanpa memerlukan akun.
* **Acceptance Criteria:**
  * **Beranda Publik:** Menampilkan profil singkat desa, statistik ringkas proyek, ringkasan anggaran desa, dan sorotan proyek terbaru.
  * **Katalog & Detail Proyek:** Menampilkan daftar proyek publik dengan filter (tahun, status, jenis/lokasi) serta halaman detail berisi informasi umum, progres fisik, ringkasan realisasi anggaran, dan galeri foto 3 tahap yang telah diverifikasi.
  * **Peta Proyek Interaktif:** Menampilkan titik koordinat seluruh proyek publik; klik pada *marker* menampilkan *popup* ringkasan dan tautan ke detail proyek.
  * **Transparansi Anggaran:** Menampilkan grafik perbandingan pagu vs. realisasi dan rincian serapan per proyek.
  * **Pengaduan Masyarakat:** Warga dapat mengisi formulir pengaduan yang dilindungi CAPTCHA, lalu memperoleh **Kode Tiket Unik** untuk memantau status tindak lanjut dari Pemdes.

---

## 6. Spesifikasi Kebutuhan Non-Fungsional (NFR)

| Kategori | Kode | Standar Kualitas & Target Terukur |
| :--- | :--- | :--- |
| **Performa** | NFR-01 | Waktu respons proses autentikasi (*login*) maksimal **< 2 detik**. |
| **Performa** | NFR-02 | Waktu muat halaman *Dashboard* dan Portal Publik maksimal **< 3 detik**. |
| **Performa** | NFR-03 | Kalkulasi selisih dan sisa anggaran berjalan otomatis dalam **< 1 detik** dengan presisi **2 digit desimal**. |
| **Performa** | NFR-04 | Proses generasi dan unduh dokumen laporan PDF maksimal **< 5 detik**. |
| **Kapasitas** | NFR-05 | Ukuran berkas foto dokumentasi dan bukti transaksi dibatasi maksimal **5 MB** per unggahan dengan kompresi otomatis. |
| **Skalabilitas** | NFR-06 | Sistem mampu menangani minimal **100 pengguna aktif secara bersamaan** (*concurrent users*) tanpa penurunan performa signifikan. |
| **Keamanan** | NFR-07 | Kata sandi di-*hash* menggunakan **Bcrypt**; sesi menggunakan *HTTP-Only Cookies* dan proteksi token **CSRF**. |
| **Keamanan** | NFR-08 | Seluruh kueri basis data menggunakan *Parameterized Queries* untuk mencegah *SQL Injection*, serta sanitasi input untuk mencegah *XSS*. |
| **Keamanan** | NFR-09 | Validasi ketat tipe MIME berkas unggahan dan penamaan ulang file menggunakan *hash* acak untuk mencegah eksekusi skrip berbahaya. |
| **Keamanan** | NFR-10 | Fitur *Dompdf* dikonfigurasi menonaktifkan pemuatan aset jaringan eksternal (`isRemoteEnabled = false`) untuk mencegah kerentanan *SSRF*. |
| **Keamanan** | NFR-11 | Formulir pengaduan publik dilindungi **CAPTCHA** untuk mencegah *spam* otomatis. |
| **Usabilitas** | NFR-12 | Antarmuka responsif di layar desktop, tablet, dan ponsel pintar dengan skema warna identitas **Merah, Putih, dan Abu-abu Gelap**. |

---

## 7. Metodologi & Linimasa Pengembangan (16 Minggu)

Pengembangan dilaksanakan menggunakan **Model Prototyping** selama **16 minggu** agar antarmuka interaktif (SPA, peta GIS, dan grafik transparansi) dapat divalidasi lebih awal sebelum penyelesaian logika *backend* secara menyeluruh.

| Fase | Minggu | Aktivitas Utama & Luaran (*Deliverables*) |
| :--- | :--- | :--- |
| **1. Inisiasi & Analisis** | Minggu 1 – 3 | Penyusunan *Project Charter* (v1.0) dan *Software Requirements Specification* (SRS v2.0). |
| **2. Perancangan & Prototyping UI** | Minggu 4 – 6 | Penyusunan *Software Design Document* (SDD v3.0), perancangan ERD, *Wireframe*, *High-Fidelity Mockup*, serta validasi purwarupa awal. |
| **3. Pengembangan Inti (Sprint 1)** | Minggu 7 – 9 | Setup proyek sesuai `TECH-STACK.md`, migrasi database (`DATABASE.md`), implementasi Autentikasi, RBAC, Manajemen Pengguna, *Audit Trail*, serta modul Proyek & Anggaran. |
| **4. Pengembangan Fitur (Sprint 2)** | Minggu 10 – 12 | Implementasi modul Laporan Progres & unggah foto 3 tahap, alur Verifikasi & Revisi, Monitoring Risiko Keterlambatan, Portal Publik, Peta Leaflet, Pengaduan Tiket, dan Ekspor PDF. |
| **5. Pengujian (QA) & Revisi** | Minggu 13 – 14 | *Black-box testing* seluruh skenario *Use Case*, uji beban 100 pengguna serentak, audit keamanan (XSS/CSRF/Upload/SSRF), dan perbaikan *bug*. |
| **6. Deployment & Serah Terima** | Minggu 15 – 16 | Konfigurasi domain & *shared/cloud hosting* (estimasi anggaran Rp 150.000), *deployment* produksi dengan HTTPS, penyusunan panduan pengguna, dan presentasi akhir. |

---

## 8. Manajemen Risiko & Mitigasi

| Risiko | Dampak | Strategi Mitigasi |
| :--- | :--- | :--- |
| **Pembengkakan Ruang Lingkup (*Scope Creep*)** | Keterlambatan jadwal rilis melewati batas 16 minggu. | Mengunci ruang lingkup pada 7 modul utama sesuai dokumen SRS/SDD; permintaan di luar cakupan dicatat sebagai pengembangan fase berikutnya. |
| **Ukuran Foto Lapangan Terlalu Besar** | Kehabisan ruang penyimpanan server dan lambatnya pemuatan halaman galeri. | Validasi ukuran maksimal **5 MB** di sisi klien & server disertai kompresi gambar otomatis sebelum disimpan ke direktori publik. |
| **Ketidakakuratan Perhitungan Anggaran** | Selisih pencatatan pagu dan realisasi dana desa. | Menggunakan tipe data `DECIMAL(15,2)` pada seluruh kolom finansial dan menerapkan transaksi database atomik setiap kali pengeluaran dicatat. |
| **Penyalahgunaan Formulir Pengaduan Publik** | Banjir *spam* pengaduan palsu karena akses tanpa *login*. | Menerapkan validasi **CAPTCHA** dan pembatasan laju permintaan (*rate limiting*) per alamat IP pada titik akhir pengiriman pengaduan. |