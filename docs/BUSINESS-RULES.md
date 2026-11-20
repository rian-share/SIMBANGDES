# Domain Business Rules & Core Logic

## SIMBANGDES — Sistem Informasi Manajemen Pembangunan dan Transparansi Desa

Dokumen ini mendefinisikan aturan bisnis, rumus perhitungan, transisi status (*state machine*), dan otomasi sistem yang wajib diimplementasikan di lapisan *Service* dan *Observer* Laravel agar perilaku aplikasi 100% sesuai spesifikasi kebutuhan.

## 1. Aturan Keuangan & Sinkronisasi Anggaran (`BR-FIN`)

### 1.1 Kalkulasi Atomik Realisasi & Sisa Anggaran

Setiap kali terjadi operasi penambahan (`CREATE`), perubahan (`UPDATE`), atau penghapusan (`DELETE`) pada tabel `transaksi_pengeluaran`, sistem **wajib** menjalankan pembaruan pada tabel `anggaran` induk di dalam blok `DB::transaction()`:

$$
\text{Total Realisasi} = \sum_{i=1}^{n} \text{nominal}_i
$$

$$
\text{Sisa Anggaran} = \text{Pagu Anggaran} - \text{Total Realisasi}
$$

$$
\text{Persentase Serapan} = \left( \frac{\text{Total Realisasi}}{\text{Pagu Anggaran}} \right) \times 100\%
$$

* **Presisi Angka:** Seluruh hasil perhitungan dibulatkan dan disimpan hingga **2 digit desimal** (`DECIMAL(15,2)`). Jika `Pagu Anggaran = 0`, maka `Persentase Serapan = 0.00%` (hindari *division by zero*).

* **Validasi Batas Pagu:** Sistem harus menolak penyimpanan transaksi baru apabila `Total Realisasi + Nominal Baru > Pagu Anggaran` dan menampilkan pesan kesalahan bahwa pengeluaran melebihi sisa pagu tersedia.

* **Peringatan Serapan Tinggi:** Apabila `Persentase Serapan` mencapai atau melewati $85.00\%$, sistem menampilkan indikator peringatan kuning pada halaman detail keuangan proyek.

## 2. Aturan Progres, Deviasi Jadwal & Analisis Risiko (`BR-PRG`)

### 2.1 Perhitungan Target Progres Berjalan (*Expected Progress*)

Untuk mendeteksi keterlambatan secara dini pada proyek yang berstatus `'Berjalan'`, sistem menghitung persentase target jadwal berdasarkan rentang waktu antara `tanggal_mulai` ($T_{\text{mulai}}$) dan `tanggal_selesai` ($T_{\text{selesai}}$) terhadap tanggal hari ini ($T_{\text{kini}}$):

$$
\text{Target Berjalan} = \text{clamp}\left( \frac{T_{\text{kini}} - T_{\text{mulai}}}{T_{\text{selesai}} - T_{\text{mulai}}} \times \text{Target Progres}, \; 0, \; \text{Target Progres} \right)
$$

$$
\text{Deviasi Progres} = \text{Progres Aktual} - \text{Target Berjalan}
$$

### 2.2 Klasifikasi Indikator Risiko Proyek

Berdasarkan nilai `Deviasi Progres` dan tenggat waktu, sistem menentukan indikator risiko pada modul *Monitoring*:

| Kondisi Evaluasi | Level Risiko | Warna Indikator | Keterangan Bisnis | 
| ----- | ----- | ----- | ----- | 
| `status_proyek == 'Selesai'` atau `Deviasi Progres >= -5.00` | **Aman / Sesuai Target** | Hijau (`emerald`) | Progres fisik sesuai atau melampaui jadwal rencana. | 
| `-15.00 <= Deviasi Progres < -5.00` dan belum melewati `tanggal_selesai` | **Waspada Deviasi** | Kuning (`amber`) | Progres fisik mulai tertinggal 5%–15% dari jadwal berjalan. | 
| `Deviasi Progres < -15.00` atau ($T_{\text{kini}} > T_{\text{selesai}}$ dan `progres_aktual < target_progres`) | **Kritis / Terlambat** | Merah (`red`) | Proyek mengalami keterlambatan signifikan dan memerlukan intervensi Pemdes. | 

### 2.3 Transisi Status Siklus Hidup Proyek (`status_proyek`)

```
stateDiagram-v2
    [*] --> Perencanaan : Proyek dibuat Pemdes (progres = 0%)
    Perencanaan --> Berjalan : Laporan progres pertama disetujui / tanggal_mulai tiba
    Berjalan --> Terlambat : Hari ini > tanggal_selesai & progres_aktual < target_progres
    Terlambat --> Berjalan : Deadline diperpanjang oleh Pemdes
    Berjalan --> Selesai : progres_aktual >= target_progres (100.00%)
    Terlambat --> Selesai : progres_aktual >= target_progres (100.00%)
    Selesai --> [*]

```

## 3. Aturan Pelaporan & Verifikasi Berjenjang (`BR-VER`)

### 3.1 Alur Status Laporan Progres (`laporan_progres.status_verifikasi`)

```
stateDiagram-v2
    [*] --> Menunggu : Pelaksana mengirim laporan + foto
    Menunggu --> Disetujui : Pemdes menyetujui laporan
    Menunggu --> Ditolak : Pemdes mengembalikan (wajib isi catatan_revisi)
    Ditolak --> Menunggu : Pelaksana memperbaiki data/foto & mengirim ulang
    Disetujui --> [*]

```

### 3.2 Ketentuan Bisnis Pelaporan & Verifikasi

1. **Isolasi Data Proyek Pelaksana:** Pelaksana (`role = 'pelaksana'`) hanya dapat melihat dan melaporkan proyek di mana `proyek.pelaksana_id == auth()->id()`. Pelaksana dilarang keras mengubah data master proyek, nilai pagu anggaran, maupun tenggat waktu (*strict read-only*).

2. **Validasi Nilai Progres:** Nilai `persentase_fisik` yang diinput pada laporan baru harus berada pada rentang `$0.00$` hingga `$100.00$` dan tidak boleh lebih kecil dari `proyek.progres_aktual` yang sudah disetujui sebelumnya.

3. **Kewajiban Dokumentasi Foto:** Setiap pengiriman laporan progres wajib melampirkan minimal 1 berkas foto dengan klasifikasi tahap yang jelas (`'Sebelum'`, `'Saat'`, atau `'Sesudah'`).

4. **Dampak Persetujuan (`Disetujui`):**

   * Nilai `proyek.progres_aktual` diperbarui menjadi sama dengan `laporan_progres.persentase_fisik` laporan yang disetujui.

   * Sistem mencatat `verified_by = auth()->id()` dan `verified_at = now()`.

   * Jika `proyek.progres_aktual >= proyek.target_progres`, sistem otomatis mengubah `proyek.status_proyek` menjadi `'Selesai'`.

5. **Dampak Pengembalian (`Ditolak`):**

   * Nilai `proyek.progres_aktual` **tidak berubah**.

   * Pemdes wajib mengisi kolom `catatan_revisi` (minimal 10 karakter) agar Pelaksana mengetahui bagian yang harus diperbaiki.

## 4. Aturan Visibilitas Portal Publik (`BR-PUB`)

Untuk menjaga validitas informasi yang dikonsumsi masyarakat desa tanpa *login*, kueri pada seluruh pengontrol publik wajib menerapkan filter berikut:

1. **Filter Proyek Publik:** Hanya menampilkan record `proyek` dengan `is_public == 1`. Proyek internal (`is_public == 0`) tidak boleh muncul di katalog publik, peta GIS, maupun pencarian publik (kembalikan HTTP `404` jika diakses langsung melalui URL).

2. **Filter Galeri & Riwayat Laporan Publik:** Pada halaman *Detail Proyek Publik*, galeri foto (`dokumentasi_foto`) dan catatan kemajuan hanya menampilkan foto yang terhubung dengan `laporan_progres` berstatus `status_verifikasi == 'Disetujui'`. Laporan yang masih `'Menunggu'` atau `'Ditolak'` disembunyikan dari publik.

3. **Agregasi Transparansi Anggaran:** Ringkasan total anggaran dan realisasi pada halaman publik hanya menjumlahkan data dari proyek-proyek yang memiliki `is_public == 1`.

## 5. Aturan Pengaduan Masyarakat & Tiket Pelacakan (`BR-ADU`)

1. **Generator Kode Tiket Otomatis:** Setiap pengaduan valid yang dikirim warga otomatis menghasilkan `kode_tiket` unik berformat `ADU-YYYY-XXXX` (contoh: `ADU-2026-4819`, di mana `YYYY` adalah tahun berjalan dan `XXXX` adalah 4 karakter alfanumerik acak huruf kapital yang dipastikan unik di database).

2. **Alur Status Pengaduan (`status_pengaduan`):**

   * `Menunggu` (status awal saat aduan masuk) $\rightarrow$ `Diproses` (sedang ditinjau/diverifikasi lapangan oleh Pemdes) $\rightarrow$ `Selesai` atau `Ditolak`.

3. **Publikasi Tanggapan:** Ketika warga memasukkan `kode_tiket` pada fitur *Cek Status Pengaduan*, sistem menampilkan status terkini dan isi kolom `tanggapan_pemdes` tanpa mengekspos data sensitif internal aparatur.

## 6. Aturan Audit Trail & Pengelolaan Berkas (`BR-SYS`)

1. **Sifat Kekal (*Immutability*) Audit Trail:**

   * Setiap operasi penting (`Login`, `Logout`, `Create/Update/Delete Proyek`, `Catat Pengeluaran`, `Verifikasi Laporan`, `Tanggapi Pengaduan`, `Kelola User`) wajib menulis entri ke `log_aktivitas`.

   * Tidak boleh ada rute, *controller*, maupun antarmuka UI untuk mengubah (`UPDATE`) atau menghapus (`DELETE`) baris pada tabel `log_aktivitas`, termasuk oleh `admin`.

2. **Pemrosesan & Kompresi Foto:**

   * Setiap unggahan gambar divalidasi ukuran maksimal `5 MB` (`5120 KB`) dengan format `JPG`, `JPEG`, `PNG`, atau `WebP`.

   * Sebelum disimpan ke disk, gambar dikompresi dengan kualitas `80%` dan lebar maksimal `1600px` (mempertahankan rasio aspek) agar ukuran berkas akhir berkisar antara `200 KB` – `600 KB`.

   * Jika suatu record dihapus atau foto diganti saat revisi, berkas fisik lama di `storage/app/public` wajib dihapus (`Storage::disk('public')->delete(...)`) agar tidak menjadi *orphan file*.