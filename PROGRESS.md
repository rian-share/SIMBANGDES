# PROGRESS — SIMBANGDES

## Ringkasan Status Terakhir

| Atribut | Isi |
| :--- | :--- |
| **Tanggal / Sesi** | 2026-11-22 — Sesi 13 (Perombakan UI, Gelombang 3: Login, Profil, panel Pemdes/Pelaksana/Admin) |
| **Selesai** | Seluruh perombakan UI (Gelombang 1–3 `DESIGN-SYSTEM.md`); adaptor komponen lama dihapus |
| **Verifikasi** | `php artisan test` 86/86; `npm run build` sukses; smoke render SSR 27 halaman panel + 10 halaman publik OK. **Belum** dicek visual di browser (375/768/1280px), termasuk Peta (Leaflet tidak bisa di-SSR) |
| **Langkah Selanjutnya (*Next Step*)** | Uji visual di browser semua halaman, `.env` produksi dari `.env.example`, lalu rilis |

---

## 0. Keputusan yang Sudah Dikunci (Sesi 0)

### K-3 — Tabel ke-9 `berita_pengumuman` (Sesi 8, permintaan pemilik proyek)
Menambah satu tabel di luar 8 tabel awal (lihat `docs/DATABASE.md §4.9` dan `FEATURE-PUBLIK-EXTRA.md`). `konten` berupa teks polos (tanpa HTML/rich text). `slug` tidak berubah saat judul diedit. Statistik pengaduan menghitung aduan tanpa proyek atau terkait proyek publik, hanya angka agregat. Statistik dan Galeri tanpa tabel/kolom baru.


Keputusan ini diambil bersama pemilik proyek. **Jangan diubah tanpa persetujuan baru.**

### K-4 — Fitur Pemdes Ekstra (Sesi 9, permintaan pemilik proyek)
Membalik keputusan K-1 yang men-*skip* kategori belanja. Rencana: `FEATURE-PEMDES-EXTRA.md`.
- **Tabel ke-10 `rab_komponen`** (FK `anggaran_id`, unik per `anggaran_id + nama_komponen`). `transaksi_pengeluaran.rab_komponen_id` **nullable** (`nullOnDelete`); jenis pengeluaran = nama komponen, tanpa kolom teks ganda. Transaksi lama tampil sebagai "Tanpa Komponen".
- **`log_aktivitas.proyek_id`** nullable + index `(proyek_id, id)`, **tanpa FK** agar audit trail tetap append-only (cascade/null-on-delete akan mengubah/menghapus log).
- Total `nominal_rencana` per anggaran ≤ pagu; pagu tidak boleh di bawah total rencana. Realisasi per komponen boleh melebihi rencana (selisih merah); batas keras tetap total realisasi ≤ pagu.
- Format log `"{Aksi} {Entitas} #{id}: {label}"` tidak berubah; hanya label diperkaya (`— pelaksana: …`, `— pagu Rp … → Rp …`, `— Disetujui`). Uraian timeline diturunkan lewat accessor `LogAktivitas::uraian` (hanya baca).

### K-1 — 4 Kolom Tambahan (Perbaikan Teknis #5 di `DATABASE.md`)
`BUSINESS-RULES.md` dan `PRD.md` memakai kolom yang tidak ada di `DATABASE.md`. Disetujui menambah **tepat 4 kolom** berikut:

| Tabel | Kolom | Tipe | Default | Alasan |
| :--- | :--- | :--- | :--- | :--- |
| `proyek` | `target_progres` | `DECIMAL(5,2)` NOT NULL | `100.00` | BR-PRG 2.1–2.3, BR-VER 3.2.4 |
| `proyek` | `is_public` | `BOOLEAN` NOT NULL, INDEX | `1` | BR-PUB 1 & 3 |
| `proyek` | `kategori` | `VARCHAR(100)` NULL | `NULL` | PRD FR-03 & FR-07 (filter jenis) |
| `laporan_progres` | `verified_at` | `TIMESTAMP` NULL | `NULL` | BR-VER 3.2.4 |

**Tidak ditambahkan:** `transaksi_pengeluaran.kategori_belanja` (fitur kategori belanja di FR-03 di-*skip*) dan `proyek.kode_proyek`. Rute publik detail proyek memakai **`/proyek/{proyek}`** (route model binding ke `id`).

### K-2 — Ikuti Stack yang Sudah Terpasang
Terpasang: **PHP 8.4.3, Laravel 13.43, Tailwind 4, Vite 8, MySQL 8.4.3 (Laragon)**. Rencana memakai **Inertia 2 + React 19 + Tailwind 4**, bukan Laravel 10/Tailwind 3/Inertia 1 seperti di `TECH_STACK.md`. Konsekuensinya:
- Tidak ada `app/Http/Kernel.php`. Alias middleware didaftarkan di `bootstrap/app.php` melalui `->withMiddleware()`.
- Tailwind 4 memakai konfigurasi *CSS-first* (`@import "tailwindcss";` + `@theme` di `resources/css/app.css`), tanpa `tailwind.config.js`.
- Model memakai atribut PHP `#[Fillable]` / `#[Hidden]` sesuai pola `app/Models/User.php` yang sudah ada.

---

## 1. Temuan Validasi Silang (DATABASE × BUSINESS-RULES × ARCHITECTURE)

| # | Temuan | Resolusi |
| :--- | :--- | :--- |
| V-01 | Kolom `target_progres`, `is_public`, `kategori`, dan `verified_at` dipakai, tetapi tidak ada di skema | **K-1**: tambahkan 4 kolom |
| V-02 | Rute `/proyek/{kode_proyek}` tidak punya kolom pendukung | Pakai `/proyek/{proyek}` (id) |
| V-03 | `kategori belanja` pada transaksi (PRD FR-03) tidak ada di skema | Di-*skip* (K-1) |
| V-04 | Migration bawaan `users` memakai `name` + `email_verified_at`, sedangkan spesifikasi memakai `nama_lengkap`, `username`, `role`, `status_aktif` | Ubah migration bawaan `0001_01_01_000000_create_users_table.php` (lihat 1.2) |
| V-05 | Tabel framework `sessions`, `cache`, `jobs` tidak termasuk 8 tabel domain | **Pertahankan**: `SESSION_DRIVER=database` dan fitur "sesi aktif" Admin (FR-02) membaca tabel `sessions`. Tabel `password_reset_tokens` **dihapus** karena tidak ada fitur lupa-password (reset kata sandi dilakukan Admin) |
| V-06 | `log_aktivitas` & `dokumentasi_foto` hanya punya `created_at` | Model: `const UPDATED_AT = null;`. Migration: `$table->timestamp('created_at')->useCurrent()` |
| V-07 | Transisi otomatis `Perencanaan→Berjalan` (tanggal mulai tiba) dan `Berjalan→Terlambat` (lewat deadline) tidak punya pemicu | Artisan command terjadwal harian `proyek:sinkron-status` (Fase 3) + dipanggil juga setelah verifikasi laporan |
| V-08 | Transisi `Terlambat→Berjalan` saat deadline diperpanjang | Ditangani di `ProyekController@update`: jika `tanggal_selesai` baru ≥ hari ini dan status `Terlambat`, set ke `Berjalan` |
| V-09 | Batas pagu hanya dijelaskan untuk transaksi baru | Berlaku juga untuk **update** transaksi (abaikan nominal lama) dan untuk **edit pagu** (pagu baru tidak boleh < `total_realisasi`) |
| V-10 | BR-VER 3.2.2: progres baru ≥ `progres_aktual`, tetapi bisa ada beberapa laporan `Menunggu` sekaligus | Aturan tambahan: **maksimal 1 laporan `Menunggu` per proyek**. Laporan baru ditolak jika masih ada laporan yang menunggu |
| V-11 | ON DELETE CASCADE di DB tidak memicu penghapusan berkas fisik (BR-SYS 2.3) | Sebelum `Proyek::delete()`, controller menghapus berkas `dokumentasi_foto.file_path`, `transaksi_pengeluaran.bukti_transaksi`, dan `pengaduan.foto_bukti` terkait |
| V-12 | FK `RESTRICT` dari `proyek.pelaksana_id`, `transaksi.created_by`, dan `laporan.pelaksana_id` ke `users` | **Tidak ada hapus user**. Admin hanya menonaktifkan (`status_aktif = 0`), sesuai PRD FR-01 |
| V-13 | `log_aktivitas` tidak punya kolom tipe/ID model | Format teks baku: `"{Aksi} {Entitas} #{id}: {label}"`, misalnya `Create Proyek #3: Jalan Usaha Tani` |
| V-14 | `config/app.php` meng-*hardcode* `'timezone' => 'UTC'` | Ubah ke `env('APP_TIMEZONE', 'Asia/Makassar')` (dibutuhkan agar hitung deviasi harian akurat) |
| V-15 | Nama berkas `TECH-STACK.md` di CLAUDE.md/PRD tidak sama dengan berkas aktual `TECH_STACK.md` | Biarkan; rujuk `docs/TECH_STACK.md` |
| V-16 | Login memakai email **atau** username (FR-01) | Satu field `login`: `filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username'` |
| V-17 | Cek tiket pengaduan tidak boleh membocorkan data internal (BR-ADU 3) | Respons cek tiket hanya berisi `kode_tiket`, `status_pengaduan`, `tanggapan_pemdes`, `created_at`, `updated_at`. **Jangan** kirim `kontak_pelapor` dan `ditanggapi_oleh` |
| V-18 | Perhitungan uang dengan float di PHP berisiko selisih | Rekalkulasi `total_realisasi`/`sisa_anggaran` dilakukan **di SQL** (aritmetika DECIMAL eksak), bukan di PHP float (lihat 1.4) |

---

## 2. Checklist Tahapan Pengembangan

### Fase 1 — Fondasi & Database

#### 1.0 Sinkronisasi Dokumen (wajib pertama)
- [x] `docs/DATABASE.md`: tambahkan "Perbaikan teknis #5" berisi 4 kolom K-1 pada tabel 4.3 (`proyek`) dan 4.6 (`laporan_progres`)
- [x] `docs/TECH_STACK.md`: perbarui versi ke Laravel 13 / PHP 8.4 / Inertia 2 / React 19 / Tailwind 4 / Vite 8
- [x] `config/app.php`: `'timezone' => env('APP_TIMEZONE', 'Asia/Makassar')`. Tambahkan `APP_TIMEZONE=Asia/Makassar`, `APP_NAME=SIMBANGDES`, `APP_LOCALE=id`, `APP_FAKER_LOCALE=id_ID`, dan `FILESYSTEM_DISK=public` ke `.env` & `.env.example`

#### 1.1 Instalasi Package (urutan eksekusi)
```bash
# 0. Bootstrap agen (instruksi Laravel Boost di CLAUDE.md)
composer require laravel/boost --dev
php artisan boost:install          # lalu baca ulang AGENTS.md

# 1. Backend
composer require inertiajs/inertia-laravel:^2.0
composer require tightenco/ziggy:^2.0
composer require barryvdh/laravel-dompdf     # versi terbaru yang kompatibel Laravel 13
composer require intervention/image:^3.0     # driver GD (ekstensi gd sudah aktif)
composer require mews/captcha                # jika gagal resolve di Laravel 13 → pakai fallback captcha aritmetika berbasis session (Fase 5)
# TERPASANG: inertia-laravel 2.0.28 (dipin ^2.0), ziggy 2.7, dompdf 3.1, intervention/image 4.4 (bukan 3.x: composer memilih versi terbaru; API v4 — cek dokumentasi saat Fase 4), mews/captcha 3.5 (resolve OK di Laravel 13, fallback tidak diperlukan)

php artisan inertia:middleware                # → app/Http/Middleware/HandleInertiaRequests.php
php artisan vendor:publish --provider="Barryvdh\DomPDF\ServiceProvider"   # → config/dompdf.php
php artisan storage:link

# 2. Frontend
npm install @inertiajs/react react react-dom @vitejs/plugin-react
npm install chart.js react-chartjs-2
npm install leaflet react-leaflet
npm install lucide-react
```
- [x] `config/dompdf.php`: pastikan `'isRemoteEnabled' => false` (di dompdf 3.x kuncinya bernama `'enable_remote' => false`, default sudah `false`) (di dalam `options`, sesuai *Hard Constraint* #6)
- [x] `vite.config.js`: tambahkan plugin `react()`, ubah input ke `resources/js/app.jsx`
- [x] Rename `resources/js/app.js` → `resources/js/app.jsx` (setup `createInertiaApp` + `resolvePageComponent('./Pages/**/*.jsx')`)
- [x] `resources/views/app.blade.php`: root Inertia (`@routes`, `@viteReactRefresh`, `@vite`, `@inertiaHead`, `@inertia`). Hapus `welcome.blade.php`
- [x] `resources/css/app.css`: `@import "tailwindcss";` + `@import "leaflet/dist/leaflet.css";` + `@theme { --font-sans: "Plus Jakarta Sans", ui-sans-serif, sans-serif; }`
- [x] `bootstrap/app.php`: `$middleware->web(append: [HandleInertiaRequests::class]);`
- [x] **Cek:** `npm run build` sukses tanpa error

#### 1.2 Migration (8 tabel, urutan wajib sesuai FK)

Semua tabel memakai `$table->id()` (BIGINT UNSIGNED AI). Uang = `decimal(…, 15, 2)`, persen = `decimal(…, 5, 2)`.

| No | File | Isi kolom (tipe Laravel) |
| :--- | :--- | :--- |
| 1 | `0001_01_01_000000_create_users_table.php` (**ubah** bawaan) | `string('nama_lengkap',100)`, `string('username',50)->unique()`, `string('email',100)->unique()`, `string('password')`, `enum('role',['admin','pemdes','pelaksana'])->default('pelaksana')->index()`, `boolean('status_aktif')->default(true)`, `rememberToken()`, `timestamps()`. **Hapus** `name`, `email_verified_at`, dan tabel `password_reset_tokens`. **Pertahankan** tabel `sessions` |
| — | `0001_01_01_000001_create_cache_table.php`, `0001_01_01_000002_create_jobs_table.php` | Biarkan (tabel framework) |
| 2 | `2026_11_21_000001_create_log_aktivitas_table.php` | `foreignId('user_id')->nullable()->constrained('users')->nullOnDelete()`, `string('aktivitas',255)`, `string('ip_address',45)->nullable()`, `timestamp('created_at')->useCurrent()->index()` |
| 3 | `2026_11_21_000002_create_proyek_table.php` | `string('nama_proyek',150)`, `string('kategori',100)->nullable()`, `string('lokasi',200)`, `decimal('latitude',10,8)->nullable()`, `decimal('longitude',11,8)->nullable()`, `foreignId('pelaksana_id')->constrained('users')->restrictOnDelete()`, `date('tanggal_mulai')`, `date('tanggal_selesai')->index()`, `decimal('progres_aktual',5,2)->default(0)`, `decimal('target_progres',5,2)->default(100)`, `enum('status_proyek',['Perencanaan','Berjalan','Terlambat','Selesai'])->default('Perencanaan')->index()`, `boolean('is_public')->default(true)->index()`, `text('deskripsi')->nullable()`, `timestamps()` |
| 4 | `2026_11_21_000003_create_anggaran_table.php` | `foreignId('proyek_id')->unique()->constrained('proyek')->cascadeOnDelete()`, `year('tahun_anggaran')->index()`, `string('sumber_dana',100)`, `decimal('pagu_anggaran',15,2)->default(0)`, `decimal('total_realisasi',15,2)->default(0)`, `decimal('sisa_anggaran',15,2)->default(0)`, `timestamps()` |
| 5 | `2026_11_21_000004_create_transaksi_pengeluaran_table.php` | `foreignId('anggaran_id')->constrained('anggaran')->cascadeOnDelete()`, `date('tanggal_transaksi')->index()`, `string('uraian',200)`, `decimal('nominal',15,2)`, `string('bukti_transaksi',255)->nullable()`, `foreignId('created_by')->constrained('users')->restrictOnDelete()`, `timestamps()` |
| 6 | `2026_11_21_000005_create_laporan_progres_table.php` | `foreignId('proyek_id')->constrained('proyek')->cascadeOnDelete()`, `foreignId('pelaksana_id')->constrained('users')->restrictOnDelete()`, `date('tanggal_laporan')->index()`, `decimal('persentase_fisik',5,2)`, `text('keterangan')`, `text('kendala')->nullable()`, `enum('status_verifikasi',['Menunggu','Disetujui','Ditolak'])->default('Menunggu')->index()`, `text('catatan_revisi')->nullable()`, `foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete()`, `timestamp('verified_at')->nullable()`, `timestamps()` |
| 7 | `2026_11_21_000006_create_dokumentasi_foto_table.php` | `foreignId('laporan_id')->constrained('laporan_progres')->cascadeOnDelete()`, `foreignId('proyek_id')->constrained('proyek')->cascadeOnDelete()`, `enum('tahap',['Sebelum','Saat','Sesudah'])->index()`, `string('file_path',255)`, `timestamp('created_at')->useCurrent()` |
| 8 | `2026_11_21_000007_create_pengaduan_masyarakat_table.php` | `string('kode_tiket',20)->unique()`, `foreignId('proyek_id')->nullable()->constrained('proyek')->nullOnDelete()`, `string('nama_pelapor',100)`, `string('kontak_pelapor',50)->nullable()`, `string('lokasi_kejadian',200)`, `text('isi_pengaduan')`, `string('foto_bukti',255)->nullable()`, `enum('status_pengaduan',['Menunggu','Diproses','Selesai','Ditolak'])->default('Menunggu')->index()`, `text('tanggapan_pemdes')->nullable()`, `foreignId('ditanggapi_oleh')->nullable()->constrained('users')->nullOnDelete()`, `timestamps()` |

- [x] Setiap `down()`: `Schema::dropIfExists('<nama_tabel>')`
- [x] **Cek:** `php artisan migrate:fresh` sukses di MySQL `pplproject`; `SHOW CREATE TABLE anggaran` menampilkan `decimal(15,2)`

#### 1.3 Eloquent Model (8 berkas di `app/Models/`)

Semua model selain `User` wajib mendeklarasikan `protected $table` karena nama tabel tidak berbentuk jamak Inggris.

| Model | `$table` | `#[Fillable]` | `casts()` | Relasi (nama method → tipe) |
| :--- | :--- | :--- | :--- | :--- |
| `User` (**ubah**) | `users` | `nama_lengkap, username, email, password, role, status_aktif` | `password: hashed`, `status_aktif: boolean` (hapus `email_verified_at`) | `logAktivitas()` → hasMany(LogAktivitas, `user_id`) · `proyekDitugaskan()` → hasMany(Proyek, `pelaksana_id`) · `transaksiDiinput()` → hasMany(TransaksiPengeluaran, `created_by`) · `laporanDikirim()` → hasMany(LaporanProgres, `pelaksana_id`) · `laporanDiverifikasi()` → hasMany(LaporanProgres, `verified_by`) · `pengaduanDitanggapi()` → hasMany(PengaduanMasyarakat, `ditanggapi_oleh`) |
| `LogAktivitas` | `log_aktivitas` | `user_id, aktivitas, ip_address` | `created_at: datetime` | `user()` → belongsTo(User). `const UPDATED_AT = null`. Di `booted()`: event `updating` & `deleting` → `throw new LogicException('Audit trail read-only')`. Helper statis `catat(string $aktivitas): void` (isi `user_id = auth()->id()`, `ip_address = request()->ip()`) |
| `Proyek` | `proyek` | semua kolom kecuali `id`/timestamps | `latitude: decimal:8`, `longitude: decimal:8`, `tanggal_mulai: date`, `tanggal_selesai: date`, `progres_aktual: decimal:2`, `target_progres: decimal:2`, `is_public: boolean` | `pelaksana()` → belongsTo(User, `pelaksana_id`) · `anggaran()` → **hasOne**(Anggaran) · `laporanProgres()` → hasMany(LaporanProgres) · `dokumentasiFoto()` → hasMany(DokumentasiFoto) · `pengaduan()` → hasMany(PengaduanMasyarakat). Scope `scopePublik($q)` → `where('is_public', true)` |
| `Anggaran` | `anggaran` | `proyek_id, tahun_anggaran, sumber_dana, pagu_anggaran` (**bukan** `total_realisasi`/`sisa_anggaran`, yang diisi service) | `tahun_anggaran: integer`, `pagu_anggaran/total_realisasi/sisa_anggaran: decimal:2` | `proyek()` → belongsTo(Proyek) · `transaksi()` → hasMany(TransaksiPengeluaran). Accessor `persentase_serapan` (0 jika pagu 0, `round(…, 2)`) |
| `TransaksiPengeluaran` | `transaksi_pengeluaran` | `anggaran_id, tanggal_transaksi, uraian, nominal, bukti_transaksi, created_by` | `tanggal_transaksi: date`, `nominal: decimal:2` | `anggaran()` → belongsTo(Anggaran) · `pembuat()` → belongsTo(User, `created_by`) |
| `LaporanProgres` | `laporan_progres` | `proyek_id, pelaksana_id, tanggal_laporan, persentase_fisik, keterangan, kendala` (status/verifikasi diisi controller) | `tanggal_laporan: date`, `persentase_fisik: decimal:2`, `verified_at: datetime` | `proyek()` → belongsTo(Proyek) · `pelaksana()` → belongsTo(User, `pelaksana_id`) · `verifikator()` → belongsTo(User, `verified_by`) · `foto()` → hasMany(DokumentasiFoto, `laporan_id`) |
| `DokumentasiFoto` | `dokumentasi_foto` | `laporan_id, proyek_id, tahap, file_path` | `created_at: datetime` | `laporan()` → belongsTo(LaporanProgres, `laporan_id`) · `proyek()` → belongsTo(Proyek). `const UPDATED_AT = null` |
| `PengaduanMasyarakat` | `pengaduan_masyarakat` | `kode_tiket, proyek_id, nama_pelapor, kontak_pelapor, lokasi_kejadian, isi_pengaduan, foto_bukti` | — | `proyek()` → belongsTo(Proyek) · `penanggap()` → belongsTo(User, `ditanggapi_oleh`) |

- [x] `database/factories/UserFactory.php`: ganti `name` → `nama_lengkap`, tambah `username` (unik), `role`, `status_aktif`; hapus `email_verified_at` & state `unverified()`
- [x] **Cek:** `php artisan tinker` → `Proyek::with('anggaran.transaksi','pelaksana','laporanProgres.foto')->first()` tanpa error

#### 1.4 Service Inti Keuangan (dibutuhkan seeder)
- [x] `app/Services/KalkulasiAnggaranService.php`
  - `rekalkulasi(Anggaran $a): void` → satu query SQL (MySQL mengevaluasi `SET` dari kiri ke kanan, sehingga `sisa` memakai `total` yang baru):
    `UPDATE anggaran SET total_realisasi = (SELECT COALESCE(SUM(nominal),0) FROM transaksi_pengeluaran WHERE anggaran_id = ?), sisa_anggaran = pagu_anggaran - total_realisasi, updated_at = NOW() WHERE id = ?`
  - `simpanTransaksi(Anggaran $a, array $data, ?TransaksiPengeluaran $lama = null)` → `DB::transaction()` + `lockForUpdate()` pada baris anggaran, validasi `total_realisasi − nominal_lama + nominal_baru ≤ pagu` (bandingkan dengan `bccomp`/`bcadd`, skala 2), simpan, lalu `rekalkulasi()`
  - `hapusTransaksi(TransaksiPengeluaran $t)` → `DB::transaction()` + hapus berkas bukti + `rekalkulasi()`
- [x] **Test wajib** `tests/Feature/KalkulasiAnggaranTest.php`: (a) 3 transaksi dengan total = pagu → sisa `0.00`; (b) transaksi melebihi pagu ditolak dan saldo tidak berubah; (c) hapus transaksi → realisasi turun; (d) pagu `0` → serapan `0.00`

#### 1.5 `DatabaseSeeder`
Pertahankan `WithoutModelEvents` agar seeding tidak mengisi audit trail.

- [x] **Akun** (password semua `password`, hanya untuk lokal):

  | nama_lengkap | username | email | role |
  | :--- | :--- | :--- | :--- |
  | Administrator Sistem | `admin` | `admin@simbangdes.test` | `admin` |
  | Kepala Desa | `pemdes` | `pemdes@simbangdes.test` | `pemdes` |
  | TPK Dusun I | `pelaksana` | `pelaksana@simbangdes.test` | `pelaksana` |
  | CV Karya Desa | `pelaksana2` | `pelaksana2@simbangdes.test` | `pelaksana` |
  | Pelaksana Nonaktif | `nonaktif` | `nonaktif@simbangdes.test` | `pelaksana`, `status_aktif = false` |

- [x] **6 proyek simulasi** (tanggal relatif terhadap `now()` agar status selalu relevan; koordinat di sekitar satu titik desa), masing-masing dengan 1 `anggaran` (tahun berjalan, `Dana Desa`/`ADD`):

  | Proyek | Pelaksana | Jadwal | progres_aktual | status | is_public | Tujuan uji |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | Pembangunan Jalan Usaha Tani | pelaksana | −60 hr s/d +30 hr | 65.00 | Berjalan | 1 | Risiko **Aman** |
  | Drainase Dusun II | pelaksana | −50 hr s/d +10 hr | 55.00 | Berjalan | 1 | Risiko **Waspada** |
  | Rehab Posyandu | pelaksana2 | −90 hr s/d −5 hr | 70.00 | Terlambat | 1 | Risiko **Kritis** |
  | Sumur Bor Air Bersih | pelaksana2 | −120 hr s/d −30 hr | 100.00 | Selesai | 1 | Galeri lengkap 3 tahap |
  | Gapura Desa | pelaksana | +10 hr s/d +70 hr | 0.00 | Perencanaan | 1 | Belum mulai |
  | Renovasi Kantor Desa (internal) | pelaksana2 | −30 hr s/d +60 hr | 20.00 | Berjalan | **0** | Uji filter BR-PUB |

- [x] **Transaksi**: 2–4 per proyek, dibuat melalui `KalkulasiAnggaranService::simpanTransaksi()` agar `total_realisasi`/`sisa_anggaran` konsisten. Satu proyek dibuat dengan serapan ≥ 85% (uji peringatan kuning)
- [x] **Laporan progres**: setiap proyek non-Perencanaan punya ≥ 1 laporan `Disetujui` (persentase = `progres_aktual`, `verified_by` = pemdes, `verified_at` terisi); Drainase punya 1 laporan `Menunggu`; Rehab Posyandu punya 1 laporan `Ditolak` dengan `catatan_revisi`
- [x] **Dokumentasi foto**: buat gambar placeholder dengan GD (`imagecreatetruecolor` + `imagejpeg`) ke `storage/app/public/dokumentasi/{uuid}.jpg`; tiap laporan Disetujui punya 1–3 foto (Sebelum/Saat/Sesudah)
- [x] **Pengaduan**: 3 record dengan status `Menunggu`, `Diproses` (+tanggapan), dan `Selesai` (+tanggapan, `ditanggapi_oleh` = pemdes), memakai `TiketPengaduanService` (atau inline `ADU-{Y}-{Str::upper(Str::random(4))}` + cek unik)
- [x] **Cek akhir Fase 1:** `php artisan migrate:fresh --seed` sukses · `php artisan test` hijau · `graphify update .`

### Fase 2 — Autentikasi, RBAC, Audit Trail & Layout Bento
- [x] `app/Http/Middleware/CheckRole.php`: `handle($request, $next, string ...$roles)` → `abort(403)` jika `!in_array($request->user()->role, $roles)`. Alias `role` di `bootstrap/app.php`
- [x] `app/Http/Middleware/CheckActiveUser.php`: jika `!status_aktif` → `LogAktivitas::catat('Logout (akun nonaktif)')`, `Auth::logout()`, invalidate session, redirect `login` + flash error. Alias `active`
- [x] `HandleInertiaRequests::share()`: `auth.user` (`id, nama_lengkap, username, email, role` saja) dan `flash` (`success, error, warning, ticket_code`)
- [x] `Auth/LoginController` (`create`, `store`) + `Auth/LogoutController`; field tunggal `login` (V-16); tolak akun nonaktif; `throttle:5,1` pada `POST /login`; `session()->regenerate()`; catat `Login`/`Logout`; redirect berdasarkan role ke `/{role}/dashboard`
- [x] `app/Observers/AuditTrailObserver.php` (event `created`/`updated`/`deleted`) didaftarkan di `AppServiceProvider::boot()` untuk `Proyek`, `Anggaran`, `TransaksiPengeluaran`, `LaporanProgres`, `PengaduanMasyarakat`, `User`. Format teks V-13. Lewati jika tidak ada `auth()->user()` (konteks seeder/console)
- [x] `routes/web.php`: 4 grup (publik, `/pemdes`, `/pelaksana`, `/admin`) dengan `['auth','active','role:x']`; alias `guest` redirect bila sudah login
- [x] Layout: `resources/js/Layouts/AuthenticatedLayout.jsx` (sidebar `slate-900`, menu per role, drawer mobile, aksen aktif `red-600`) dan `PublicLayout.jsx` (navbar merah-putih, footer). Komponen bersama `resources/js/Components/BentoCard.jsx` (`bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5`) + `BentoGrid` (`grid grid-cols-12 gap-4 lg:gap-6`), `StatusBadge.jsx`, `MoneyFormat.jsx` (`Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR'})` + `tabular-nums`), `FlashToast.jsx`
- [x] `Pages/Auth/Login.jsx` (layout Bento 2 kolom: panel identitas merah + form)
- [x] `ProfileController` + `Pages/Profile/Edit.jsx` (ubah nama, email, password)
- [x] **Test:** login dengan email & username; akun nonaktif ditolak; role pelaksana → `/pemdes/*` = 403; login/logout tercatat di `log_aktivitas`

### Fase 3 — Modul Pemdes
- [x] `Pemdes/DashboardPemdesController` + `Pages/Pemdes/Dashboard.jsx`: 7 kartu (Total, Berjalan, Selesai, Terlambat, Total Pagu, Realisasi, Sisa) + **Bar chart Pagu vs Realisasi per proyek** + **Doughnut status proyek** (react-chartjs-2) + daftar laporan Menunggu + daftar proyek berisiko
- [x] `ProyekController` (resource) + `StoreProyekRequest`/`UpdateProyekRequest`: proyek & anggaran dibuat dalam satu `DB::transaction()`; `pelaksana_id` divalidasi `exists:users,id,role,pelaksana,status_aktif,1`; input koordinat via `Components/MapPicker.jsx` (react-leaflet); V-08 saat update; V-11 saat destroy
- [x] `AnggaranController`: edit pagu & sumber dana (V-09), daftar + CRUD transaksi via `KalkulasiAnggaranService`; bukti `mimes:jpg,jpeg,png,pdf|max:5120`, nama `Str::uuid()`; badge kuning bila serapan ≥ 85%
- [x] `app/Services/AnalisisRisikoService.php`: `targetBerjalan()`, `deviasi()`, `levelRisiko()` sesuai BR-PRG 2.1–2.2 (clamp, guard bila `tanggal_selesai == tanggal_mulai`). **Unit test** untuk 3 level risiko + batas −5.00 / −15.00
- [x] Halaman `Pages/Pemdes/Monitoring/Index.jsx`: tabel proyek + target berjalan + deviasi + badge risiko (emerald/amber/red)
- [x] Command `app/Console/Commands/SinkronStatusProyek.php` (`proyek:sinkron-status`): Perencanaan→Berjalan (`tanggal_mulai ≤ hari ini`), Berjalan→Terlambat (lewat deadline & progres < target). Jadwalkan `->daily()` di `routes/console.php`
- [x] `VerifikasiLaporanController`: `approve` (dalam `DB::transaction()`: set Disetujui, `verified_by`, `verified_at`, `proyek.progres_aktual = persentase_fisik`, status Berjalan bila masih Perencanaan, Selesai bila ≥ target) & `reject` (`catatan_revisi` `required|min:10`, progres tidak berubah); hanya laporan berstatus `Menunggu`
- [x] `PengaduanAdminController`: index (filter status), show (foto bukti), update status + `tanggapan_pemdes` + `ditanggapi_oleh`
- [x] `LaporanPdfController` + `resources/views/pdf/rekap_proyek.blade.php`: rekap proyek & realisasi; gambar hanya via `public_path()`/`storage_path()`
- [x] **Test:** approve memperbarui progres & status; reject tanpa catatan → 422; transaksi melebihi pagu → error

### Fase 4 — Modul Pelaksana & Admin
- [x] `Pelaksana/DashboardPelaksanaController` + `Dashboard.jsx`: kartu ringkas + **Bar chart horizontal progres fisik per proyek** + **Doughnut status laporan (Menunggu/Disetujui/Ditolak)**
- [x] `ProyekTugasController`: index/show hanya `where('pelaksana_id', auth()->id())` (akses proyek lain → 404); anggaran & tenggat *read-only*
- [x] `LaporanProgresController` + `StoreLaporanRequest`: `persentase_fisik` `numeric|between:0,100|gte:progres_aktual`; V-10; `foto` min 1, tiap foto `image|mimes:jpg,jpeg,png,webp|max:5120` + `tahap` `in:Sebelum,Saat,Sesudah`
- [x] `app/Services/ImageCompressionService.php` (Intervention v3, GD): `scaleDown(width: 1600)`, encode kualitas 80, simpan `dokumentasi/{uuid}.{ext}` di disk `public`
- [x] Revisi laporan Ditolak: edit data & ganti/hapus foto (hapus berkas lama), status kembali `Menunggu`, `catatan_revisi` tetap terlihat sampai dikirim ulang
- [x] `Admin/DashboardAdminController` + `Dashboard.jsx`: kartu (total user, aktif, sesi berjalan dari tabel `sessions`) + **Line chart login harian 14 hari** (dari `log_aktivitas` dengan `aktivitas LIKE 'Login%'`) + **Doughnut user aktif per role** + 10 log terbaru
- [x] `UserManagementController`: index/create/store/edit/update + `toggleStatus` + `resetPassword`; `role` `in:admin,pemdes,pelaksana`; **tidak ada destroy** (V-12); admin tidak bisa menonaktifkan dirinya sendiri
- [x] `AuditTrailController`: **hanya `index`** (filter user/tanggal, paginasi). Tidak ada rute/tombol edit/hapus
- [x] `BackupController`: `mysqldump` via `Illuminate\Support\Facades\Process` (path dari env `MYSQLDUMP_PATH`) → `storage/app/private/backups/{tanggal}.sql`, daftar & unduh; catat ke audit trail
- [x] **Test:** pelaksana A tidak bisa melihat/melapor proyek pelaksana B; upload > 5 MB / MIME salah ditolak; rute update/delete `log_aktivitas` tidak ada (`php artisan route:list`)

### Fase 5 — Portal Publik & QA
- [x] `Publik/BerandaController` + `Home.jsx`: Bento grid (hero desa `col-span-12`, statistik `lg:col-span-4`, ringkasan anggaran `lg:col-span-8`, proyek terbaru)
- [x] `ProyekPublikController`: index (filter tahun/status/kategori/lokasi, paginasi) & show `/proyek/{proyek}` → `abort_unless($proyek->is_public, 404)`; galeri & riwayat hanya dari laporan `Disetujui` (BR-PUB 2)
- [x] `PetaController` + `Peta.jsx`: react-leaflet + tile OpenStreetMap, marker proyek publik ber-koordinat, popup ringkas + tautan detail. Catatan: impor ikon marker Leaflet secara eksplisit (bug ikon default di Vite)
- [x] Transparansi `Transparansi.jsx`: bar chart pagu vs realisasi + tabel serapan per proyek, agregasi **hanya `is_public = 1`** (BR-PUB 3)
- [x] `PengaduanPublikController`: form + CAPTCHA (mews/captcha atau fallback aritmetika session) + `throttle:3,1`; foto bukti opsional (aturan upload yang sama); `app/Services/TiketPengaduanService.php` (`ADU-YYYY-XXXX`, loop sampai unik); flash `ticket_code`; cek tiket sesuai V-17
- [x] QA: black-box per FR-01..FR-07; uji keamanan (CSRF, XSS di field teks, upload `.php` yang di-*rename*, SSRF dompdf, akses lintas role); cek responsif 375px/768px/1280px; `APP_DEBUG=false` + `SESSION_ENCRYPT=true` + `SESSION_SECURE_COOKIE=true` untuk produksi
- [x] Uji performa ringan: muat dashboard & beranda < 3 dtk, PDF < 5 dtk (eager loading, cegah N+1)

---

## 3. Daftar File Utama yang Dibuat/Diubah

| Sesi | File | Keterangan |
| :--- | :--- | :--- |
| 0 | `PROGRESS.md` | Dibuat: rencana 5 fase & keputusan K-1/K-2 |

### Log Sesi 1 — Fase 1 (2026-11-21)

**Dibuat / diubah:**
- Dokumen/config: `CLAUDE.md` (judul stack; Boost menambahkan blok panduan Laravel di atasnya), `docs/DATABASE.md` (perbaikan #5 + 4 kolom), `docs/TECH_STACK.md` (versi), `config/app.php` (timezone `Asia/Makassar` via env), `.env` & `.env.example` (`APP_NAME`, `APP_TIMEZONE`, `APP_LOCALE=id`, `APP_FAKER_LOCALE=id_ID`, `FILESYSTEM_DISK=public`, `.env.example` memakai MySQL `pplproject`), `config/dompdf.php`
- Frontend: `vite.config.js` (plugin React, font Plus Jakarta Sans), `resources/js/app.jsx` (menggantikan `app.js`), `resources/js/Pages/Placeholder.jsx` (sementara), `resources/views/app.blade.php` (menggantikan `welcome.blade.php`), `resources/css/app.css` (leaflet css + `@theme`), `routes/web.php` (rute `/` placeholder Inertia), `bootstrap/app.php` (middleware Inertia), `app/Http/Middleware/HandleInertiaRequests.php` (masih bawaan, `share()` diisi di Fase 2)
- Database: `0001_01_01_000000_create_users_table.php` (diubah) + 7 migration `2026_11_21_000001…000007` (log_aktivitas, proyek, anggaran, transaksi_pengeluaran, laporan_progres, dokumentasi_foto, pengaduan_masyarakat)
- Model (`app/Models/`): `User`, `LogAktivitas` (read-only), `Proyek`, `Anggaran`, `TransaksiPengeluaran`, `LaporanProgres`, `DokumentasiFoto`, `PengaduanMasyarakat`
- Service: `app/Services/KalkulasiAnggaranService.php`, `app/Services/TiketPengaduanService.php`
- Seeder/factory: `database/seeders/DatabaseSeeder.php`, `database/factories/UserFactory.php` (state `role()`, `nonaktif()`)
- Test: `tests/Feature/KalkulasiAnggaranTest.php` (ExampleTest bawaan dihapus)

**Catatan penting untuk sesi berikutnya:**
- `total_realisasi`/`sisa_anggaran` **tidak fillable**; ubah hanya lewat `KalkulasiAnggaranService`. `rekalkulasi()` memakai subquery yang sama untuk kedua kolom (portabel MySQL & SQLite uji).
- Test memakai SQLite `:memory:` (sesuai `phpunit.xml`); seeder & aplikasi memakai MySQL.
- `LogAktivitas::catat('...')` tersedia sebagai helper audit trail (dipakai Fase 2).
- Seeder memakai `WithoutModelEvents`, jadi seeding tidak mengisi `log_aktivitas`.
- Akun demo (password `password`): `admin`, `pemdes`, `pelaksana`, `pelaksana2`, `nonaktif` (`@simbangdes.test`).
- Boost sudah dipasang (`laravel/boost` dev + `.mcp.json`); Inertia terpasang v2 (sesuai K-2).
- `public/storage` sudah ditautkan (`storage:link`).

### Log Sesi 2 — Fase 2 (2026-11-21)

**Dibuat / diubah:**
- Middleware: `app/Http/Middleware/CheckRole.php` (alias `role`), `CheckActiveUser.php` (alias `active`), `HandleInertiaRequests.php` (share `auth.user` = `id, nama_lengkap, username, email, role` dan `flash` = `success, error, warning, ticket_code`), `bootstrap/app.php` (alias + `redirectUsersTo` ke `{role}.dashboard`)
- Auth: `Http/Controllers/Auth/LoginController.php` (field `login` = email atau username, tolak akun nonaktif, `throttle:5,1`), `LogoutController.php`, `Http/Controllers/ProfileController.php` (nama, email, ganti sandi)
- Audit trail: `app/Observers/AuditTrailObserver.php` didaftarkan di `AppServiceProvider::boot()` untuk 6 model; `LogAktivitas::catat()` dipakai untuk Login/Logout
- Routes: `routes/web.php` (publik `/`, `/login`, `/logout`, `/profil`, dan `/{role}/dashboard` untuk 3 role)
- Frontend: `Layouts/AuthenticatedLayout.jsx`, `Layouts/PublicLayout.jsx`, `Components/{BentoCard (+BentoGrid),StatusBadge,MoneyFormat,FlashToast}.jsx`, `Pages/Auth/Login.jsx`, `Pages/Profile/Edit.jsx`, `Pages/Public/Home.jsx` (kerangka), `Pages/DashboardSementara.jsx` (sementara); `vite.config.js` (alias `@` = `resources/js`)
- Test: `tests/Feature/AuthTest.php` (14 test)

**Catatan penting untuk sesi berikutnya:**
- Kolom status akun di skema bernama **`status_aktif`** (bukan `is_active`).
- Observer audit melewati konteks tanpa user login (seeder, pengaduan publik) dan perubahan `remember_token`. Perubahan lewat `DB::update` mentah (mis. `KalkulasiAnggaranService::rekalkulasi`) tidak memicu observer, jadi hanya transaksinya yang tercatat.
- Dashboard `/{role}/dashboard` masih `DashboardSementara.jsx` lewat closure di `routes/web.php`; ganti dengan controller di Fase 3/4 (nama rute `pemdes.dashboard` dst. harus dipertahankan, karena dipakai redirect login dan layout).
- Menu sidebar ada di konstanta `MENU` pada `AuthenticatedLayout.jsx`; tambahkan item tiap modul baru di sana. Tautan portal publik ditambahkan di `PublicLayout.jsx` pada Fase 5.
- Komponen React memakai fungsi global `route()` dari Ziggy (`@routes` di `app.blade.php`).
- Test feature memakai `$this->withoutVite()`; tidak memerlukan `npm run build`.
- Tailwind v4 tidak menyertakan plugin forms: input harus memakai kelas `border border-slate-300` eksplisit.
- Validasi login/profil memakai `$request->validate()` di controller (bukan FormRequest) karena kecil; FormRequest dipakai untuk modul berisi banyak field mulai Fase 3.

## Log Sesi 3 — Fase 3 (Modul Pemdes)

- Backend: `app/Http/Controllers/Pemdes/{DashboardPemdes,Proyek,Anggaran,Monitoring,VerifikasiLaporan,PengaduanAdmin,LaporanPdf}Controller.php`; `app/Http/Requests/Pemdes/*` (Store/UpdateProyek, UpdateAnggaran, Transaksi, TolakLaporan, TanggapiPengaduan); `app/Services/AnalisisRisikoService.php`; `app/Console/Commands/SinkronStatusProyek.php` (dijadwalkan `->daily()` di `routes/console.php`); `resources/views/pdf/rekap_proyek.blade.php`; rute `/pemdes/*` di `routes/web.php`.
- Frontend: `Pages/Pemdes/{Dashboard,Proyek/Index,Proyek/Form,Anggaran/Show,Monitoring/Index,Laporan/Index,Pengaduan/Index,Pengaduan/Show}.jsx`; komponen baru `Components/{Field,Pagination}.jsx`; menu pemdes di `AuthenticatedLayout.jsx` (item mendukung `match`).
- Test: `tests/Feature/PemdesTest.php`, `tests/Unit/AnalisisRisikoServiceTest.php`.
- Keputusan: koordinat proyek memakai input lat/long biasa (`MapPicker` react-leaflet belum dibuat); update transaksi memakai `POST /pemdes/transaksi/{id}` (multipart); anggaran dibuka dari daftar proyek (tanpa halaman detail proyek); risiko Kritis juga dipicu lewat tenggat sebelum cek Aman.
- Verifikasi laporan menolak (422) laporan yang sudah tidak berstatus Menunggu.

## Log Sesi 4 — Fase 4 (Pelaksana & Admin)

- Pelaksana: `Controllers/Pelaksana/{DashboardPelaksana,ProyekTugas,LaporanProgres}Controller.php`, `Requests/Pelaksana/{Store,Update}LaporanRequest.php` (404 untuk proyek/laporan milik orang lain via `prepareForValidation`), `Services/ImageCompressionService.php` (Intervention v4: `ImageManager::usingDriver(Driver::class)->decodePath()->scaleDown(width: 1600)->encodeUsingFormat(Format::WEBP, quality: 80)`), halaman `Pages/Pelaksana/*`.
- Admin: `Controllers/Admin/{DashboardAdmin,UserManagement,AuditTrail,Backup}Controller.php`, `Requests/Admin/{Store,Update}UserRequest.php`, halaman `Pages/Admin/*`; `config/database.php` + `.env.example`: `MYSQLDUMP_PATH`.
- `DashboardSementara.jsx` dihapus; rute dashboard `pelaksana.dashboard`/`admin.dashboard` dipertahankan. Menu sidebar diperbarui.
- Keputusan: foto disimpan sebagai WebP (semua format input dikonversi); tahap 0%/50%/100% dipetakan ke enum `Sebelum`/`Saat`/`Sesudah`; revisi mengganti foto per tahap dan `catatan_revisi` dipertahankan; reset password oleh admin memakai form sandi baru (bukan sandi acak); admin tidak bisa mengubah role/menonaktifkan dirinya sendiri.
- Test: `tests/Feature/PelaksanaAdminTest.php` (backup memakai `Process::fake`, mysqldump asli belum dijalankan di test).


### Log Sesi 5 — Fase 5 Portal Publik (2026-11-21)

**Dibuat / diubah:**
- Controller `app/Http/Controllers/Publik/`: `BerandaController`, `ProyekPublikController`, `PetaController`, `TransparansiController`, `PengaduanPublikController`; `app/Http/Requests/StorePengaduanRequest.php`; rute publik di `routes/web.php` (POST pengaduan `throttle:3,1`, cek tiket `throttle:20,1`)
- Frontend: `Layouts/PublicLayout.jsx` (navbar+footer lengkap), `Pages/Public/{Home,Peta,Transparansi}.jsx`, `Pages/Public/Proyek/{Index,Show}.jsx`, `Pages/Public/Pengaduan/{Create,Cek}.jsx`
- Test: `tests/Feature/PublikTest.php` (11 test)

**Catatan:** semua query publik memakai `Proyek::publik()`; detail proyek non-publik 404; cek tiket tidak mengirim kontak/nama pelapor (V-17). CAPTCHA `mews/captcha` (`captcha_src()` + rule `captcha`). Foto bukti via `ImageCompressionService` (folder `pengaduan`, nama UUID, WebP). Item QA/performa/hardening di Fase 5 sengaja tetap `[ ]` karena belum dijalankan manual.

### Log Sesi 6 — Audit Penutup QA, Security & Performance (2026-11-21)

**Dibuat / diubah:**
- `app/Providers/AppServiceProvider.php`: `Model::preventLazyLoading(! isProduction())`, sehingga N+1 melempar exception di lokal & test
- `.env.example`: default produksi (`APP_ENV=production`, `APP_DEBUG=false`, `SESSION_ENCRYPT=true`, `SESSION_SECURE_COOKIE=true`), dengan komentar untuk nilai lokal. `.env` lokal tidak diubah
- `tests/Feature/KeamananTest.php` (5 test): mass-assignment kolom internal pengaduan, upload `.php` yang diganti ekstensinya jadi `.jpg` (berkas nyata, MIME dari isi), data pelapor tertutup untuk tamu/pelaksana/admin, rute internal tertutup untuk tamu, XSS di-escape

**Hasil audit:**
- Integritas berkas pasca-glitch: `StorePengaduanRequest`, `Publik/PengaduanPublikController`, `Pengaduan/{Create,Cek}.jsx` utuh; `php -l` bersih untuk seluruh `app/` & `routes/`
- Keamanan: semua model memakai `#[Fillable]` (tanpa `$guarded = []`); kolom status/verifikasi diisi `forceFill` dari `validated()`; IDOR pelaksana → 404 (`abort_unless` kepemilikan); role → 403; shared prop `auth.user` tanpa password/token; cek tiket tanpa kontak/nama pelapor; CSRF bawaan Laravel aktif tanpa pengecualian; Dompdf `enable_remote=false` + `chroot` ke base path; satu-satunya `dangerouslySetInnerHTML` (Pagination) hanya merender label paginasi bawaan Laravel
- Temuan platform: libmagic di PHP 8.4.3 Windows gagal membaca isi tertentu (mis. `<?php system($_GET["c"]); ?>`), sehingga validasi melempar 500. Berkas tetap tidak tersimpan; di Linux (produksi) tidak terjadi
- Performa (MySQL lokal, `Kernel::handle`, tanpa jaringan). Jumlah query **konstan** saat data naik dari 6 ke 306 proyek, artinya tanpa N+1:

| Endpoint | 6 proyek | 306 proyek | Query |
| :--- | ---: | ---: | ---: |
| `/` beranda | 191 ms (cold) | 15 ms | 6–7 |
| `/proyek`, `/proyek/{id}` | 30 / 19 ms | 20 / 12 ms | 7 / 6 |
| `/peta` | 8 ms | 38 ms | 3 |
| `/transparansi` | 12 ms | 89 ms | 4 |
| `/pemdes/dashboard` | 23 ms | 133 ms | 11 |
| `/pemdes/rekap-pdf` (Dompdf) | 321 ms | 1.986 ms | 5 |

  Semua di bawah target (halaman < 3 dtk, PDF < 5 dtk)
- Responsif: hanya ditinjau di tingkat kelas Tailwind (grid `col-span-12` → `lg:col-span-*`, navbar `overflow-x-auto`, tabel `overflow-x-auto`); **belum** diuji visual di browser


### Log Sesi 7 — UI Polish Tahap A, B, C (2026-11-21)

Rencana lengkap di `UI-POLISH.md`. Hanya `resources/css` & `resources/js` yang diubah; controller, migration, dan prop Inertia tidak disentuh.

- **Tahap A:** `app.css` (leaflet di `layer(components)`, aturan ubin, isolasi z-index peta), `BentoGrid` 1/6/12 kolom + `BentoCard` rounded-3xl, komponen baru `StatCard`, `ProgressBar`, `EmptyState`, `PetaProyek`, `chartSetup.js`; `StatusBadge`, `Field`, `Pagination`, `FlashToast`, `PublicLayout`, `AuthenticatedLayout` dirombak
- **Tahap B:** 7 halaman Portal Publik ditulis ulang
- **Tahap C:** `Login`; dashboard Pemdes/Pelaksana/Admin (memakai `StatCard` + `chartSetup.js`, doughnut dengan total di tengah, tinggi chart Pelaksana dibatasi); tabel Proyek, Monitoring, Pengaduan, Laporan, User, Audit, Backup, Laporan Pelaksana diseragamkan (`overflow-x-auto`, header tabel, `EmptyState`, `formatTanggal`); `Anggaran/Show`, `Pengaduan/Show`, `Pelaksana/Proyek/*`, `Field` (gaya file input) dirapikan
- **Verifikasi:** `npm run build` sukses, `php artisan test` 62/62. **Belum** diperiksa visual di browser (375/768/1280px)


### Log Sesi 8 — Fitur Publik Ekstra (2026-11-21)

Rencana: `FEATURE-PUBLIK-EXTRA.md`.

- **Backend:** migration `berita_pengumuman`; `Models/BeritaPengumuman` (+ factory, scope `terbit()`, `buatSlug()`) terdaftar di `AuditTrailObserver` (label = judul) via `AppServiceProvider`; `User::beritaPengumuman()`; `Pemdes/BeritaController` + `Requests/Pemdes/BeritaRequest` (cover lewat `ImageCompressionService` → WebP, update memakai POST); `Publik/{Statistik,BeritaPublik,Galeri}Controller` (agregasi di SQL, eager loading, field galeri dibatasi); `BeritaSeeder` (5 data, 1 draf) dipanggil dari `DatabaseSeeder`, placeholder seed kini WebP
- **Rute:** `/statistik`, `/berita`, `/berita/{slug}`, `/galeri`, `/pemdes/berita` (resource + `POST berita/{berita}` untuk update)
- **Frontend:** `Components/Lightbox.jsx` (dipakai Galeri, Detail Proyek, cover Berita); `PublicLayout` menu bergrup (dropdown desktop, seksi di seluler); halaman `Public/{Statistik,Galeri}.jsx`, `Public/Berita/{Index,Show}.jsx`, `Pemdes/Berita/{Index,Form}.jsx`; Beranda ditambah kartu tautan Statistik/Galeri dan Berita Terbaru; sidebar Pemdes + menu Berita; `chartSetup.js` mendaftarkan `LineController` (chart campuran)
- **Test:** `tests/Feature/PublikExtraTest.php` (12 test: akses guest + lazy loading, statistik hanya proyek publik, draf/terjadwal 404, filter berita & galeri, CRUD Pemdes + cover WebP + audit log, validasi, RBAC)
- **Database lokal:** `php artisan migrate` + `db:seed --class=BeritaSeeder` (data lain tidak disentuh)
- **Verifikasi:** `php artisan test` 74/74, `npm run build` sukses. **Belum** diperiksa visual di browser (375/768/1280px), termasuk dropdown navbar dan lightbox

### Log Sesi 9 — Fitur Pemdes Ekstra (2026-11-22)

Rencana: `FEATURE-PEMDES-EXTRA.md`. Keputusan: K-4.

- **Database:** migration `2026_11_22_000001_create_rab_komponen_table`, `…000002_add_rab_komponen_id_to_transaksi_pengeluaran_table`, `…000003_add_proyek_id_to_log_aktivitas_table`. Model `RabKomponen` (+ factory) terdaftar di `AuditTrailObserver`; relasi `Anggaran::komponen()`, `TransaksiPengeluaran::komponen()`, `Proyek::logAktivitas()`
- **Audit trail:** `LogAktivitas::catat($aktivitas, ?$proyekId)` + accessor `uraian`; hook `updating`/`deleting` tidak diubah. `AuditTrailObserver` mengisi `proyek_id` (tanpa menyentuh relasi) dan label informatif untuk Update Proyek/Anggaran/LaporanProgres
- **Service:** `KalkulasiAnggaranService::rencanaVsRealisasi(?Anggaran)` (null = rekap desa, string DECIMAL via `bcmath`) dan `simpanKomponen()` (transaksi + `lockForUpdate`); metode lama tidak diubah
- **Controller/Request:** `Pemdes/{KeuanganController,RabKomponenController,RiwayatProyekController}`, `ProyekController@show`, `AnggaranController` (show + cek pagu ≥ total rencana), `Requests/Pemdes/RabKomponenRequest`, `TransaksiRequest` (+ `rab_komponen_id` ber-scope anggaran yang sama)
- **Rute (`role:pemdes`):** `pemdes.proyek.show`, `pemdes.keuangan.{anggaran,pengeluaran,rencana-realisasi}`, `pemdes.komponen.{store,update,destroy}`, `pemdes.riwayat.index`
- **Frontend:** `Components/{Selisih,FormTransaksi,GrafikRencanaRealisasi,TimelineRiwayat}.jsx`; `Pages/Pemdes/Keuangan/{Anggaran,Pengeluaran,RencanaRealisasi}.jsx`, `Pages/Pemdes/Proyek/Show.jsx`, `Pages/Pemdes/Riwayat/Index.jsx`; `Anggaran/Show.jsx` (rincian komponen, form dipindah ke `FormTransaksi`), `Proyek/Index.jsx` (tombol Detail); `AuthenticatedLayout` sidebar mendukung grup (`children`) + menu Riwayat Proyek
- **Seeder:** 6 proyek kini punya komponen RAB, transaksi per komponen, dan riwayat kronologis (insert langsung ke `log_aktivitas` dengan `created_at` simulasi). Proyek #1: Material 40/45 jt, Tenaga Kerja 30/28 jt, Transportasi 10/12 jt
- **Test:** `tests/Feature/PemdesExtraTest.php` (12 test: selisih & rekap, batas pagu/rencana, komponen lintas proyek, hapus komponen, label & `proyek_id` observer, riwayat laporan, audit read-only, render halaman tanpa lazy loading, jumlah query konstan, RBAC, seeder)
- **Catatan:** `vendor/bin/pint --dirty` tidak bisa dipakai (bukan repo git), jadi Pint dijalankan pada `app database routes tests`. **Belum** diperiksa visual di browser

### Log Sesi 11 — Perombakan UI Gelombang 1 (2026-11-22)

Rencana: `DESIGN-SYSTEM.md`. Tidak ada perubahan PHP; props Inertia tidak berubah.

- **Fondasi:** `app.blade.php` (Google Fonts Inter + Plus Jakarta Sans), `app.css` (token `--font-display`, `--shadow-card/pop`, scrollbar halus, `tabular-nums`, aturan Leaflet + `.peta-marker`; `--shadow-bento` tetap sebagai alias sementara), `vite.config.js` (font Bunny dilepas), `app.jsx` (`LucideProvider strokeWidth={1.75}`), `chartSetup.js` (palet 3 warna, controller Bar/Doughnut didaftarkan eksplisit, alias warna lama dipetakan ke palet baru)
- **`Components/UI/`:** `Button` (+`IconButton`, `buttonClass`), `PageHeader`, `BentoCard` (+`BentoGrid`, prop `span`/`flush`/`variant`), `KpiCard`, `DataTable` (tabel ≥ md, kartu < md, aksi + konfirmasi), `FilterBar`, `Form` (`FormInput`/`FormSelect`/`FormTextarea`/`FormCheckbox`), `FileDropzone`, `StatusBadge`, `EmptyState`, `Modal` (+`ConfirmProvider`/`useConfirm`), `Callout`, `ChartCard` (+`ChartFrame`), `Pagination`, `ProgressBar`, `Money`, `format.js`, `index.js`
- **Adaptor (API lama tetap jalan):** `Components/{BentoCard,StatCard,Field,StatusBadge,EmptyState,Pagination,MoneyFormat,ProgressBar}.jsx`; `FlashToast.jsx` ditulis ulang. Hapus adaptor di akhir Gelombang 3
- **Layout:** `PublicLayout` (navbar glass `backdrop-blur-md`, dropdown berdeskripsi, slide-over mobile dari kanan, footer editorial; menu "Pengaduan" diganti tautan "Cek Tiket" + CTA "Buat pengaduan") dan `AuthenticatedLayout` (sidebar putih, indikator aktif merah, breadcrumb dari struktur menu, menu avatar, drawer mobile bertransisi). Prop baru `hideTitle`: selama halaman belum memakai `PageHeader`, layout masih menampilkan `title` sebagai judul halaman
- **`PetaProyek`:** marker `divIcon`, zoom kanan-bawah, roda mouse aktif setelah peta diklik
- **Catatan:** Google Fonts mengirim IP pengunjung ke Google (alternatif: `@fontsource`, butuh dependensi baru). Rupiah kini tampil tanpa `,00`

### Log Sesi 12 — Perombakan UI Gelombang 2 (2026-11-22)

Hanya `resources/js/Pages/Public/**`; props Inertia, nama rute, dan validasi tidak berubah.

- **Halaman:** `Home`, `Proyek/{Index,Show}`, `Peta`, `Transparansi`, `Statistik`, `Berita/{Index,Show}`, `Galeri`, `Pengaduan/{Create,Cek}` (semua memakai `PageHeader` + `@/Components/UI`)
- **Peta:** kartu `flush` lebar penuh dengan panel daftar proyek mengambang (desktop kiri-atas, HP bottom sheet tertutup awal), pencarian klien, legenda di footer panel
- **Chart:** pagu `muda` + realisasi `gelap`; merah hanya bila realisasi ≥ pagu (Transparansi) atau untuk Terlambat/serapan (Statistik)
- **Pengaduan:** `FileDropzone` untuk foto bukti; tiket sukses memakai `Callout`; Cek Tiket memakai timeline vertikal 3 tahap
- **Catatan:** props Katalog Proyek tidak memuat foto, jadi kartu proyek tidak memakai gambar (tanpa mengubah backend). `Components/Lightbox.jsx` tidak diubah (sudah bersih)

### Log Sesi 13 — Perombakan UI Gelombang 3 (2026-11-22)

Hanya `resources/js/**` dan `resources/css/app.css`; props Inertia, rute, dan validasi tidak berubah.

- **Auth:** `Login` split-screen (panel kiri putih, form terpusat), `Profile/Edit`
- **Dashboard:** Pemdes (4 KPI + chart pagu/realisasi + doughnut status + laporan menunggu + proyek berisiko), Pelaksana (3 KPI + progres horizontal + status laporan + perlu revisi), Admin (3 KPI + login harian + role + `DataTable` aktivitas)
- **Pemdes:** `Proyek/{Index,Form,Show}`, `Anggaran/Show`, `Keuangan/{Anggaran,Pengeluaran,RencanaRealisasi}`, `Riwayat/Index`, `Laporan/Index` (tolak lewat `Modal`), `Monitoring`, `Pengaduan/{Index,Show}`, `Berita/{Index,Form}` memakai `PageHeader`, `DataTable` (kartu di mobile), `FilterBar`, `FormInput/Select/Textarea`, `FileDropzone`, `useConfirm` untuk semua hapus
- **Pelaksana:** `Proyek/{Index,Show}`, `Laporan/{Index,Form}` (foto 3 tahap = grid 3 kolom `FileDropzone`, catatan penolakan `Callout`)
- **Admin:** `Users/{Index,Form}`, `Audit/Index` (read-only, kolom Jenis, tanpa aksi), `Backup/Index`
- **Komponen domain:** `FormTransaksi`, `Selisih`, `GrafikRencanaRealisasi`, `TimelineRiwayat` memakai `Components/UI`
- **Pembersihan:** adaptor lama (`BentoCard`, `StatCard`, `Field`, `MoneyFormat`, `Pagination`, `EmptyState`, `StatusBadge`, `ProgressBar` di akar `Components/`), alias warna chart lama, dan `--shadow-bento` dihapus. `useConfirm` kini melempar error bila dipakai di luar `ConfirmProvider`
- **Perilaku yang berubah:** field `required` kini memicu validasi HTML sebelum kirim; Ekspor PDF memakai `<a>` biasa (unduhan), bukan `Link` Inertia

### Log Sesi 14 — Diagnostic Sweep Pasca-Perombakan UI (2026-11-22)

- **Diperiksa:** `npm run build` (0 error/warning), `php artisan test` (86/86), `storage/logs/laravel.log` (hanya error lama sesi 9 yang sudah diperbaiki), seluruh nama `route()` di JSX vs `route:list`, ikon `lucide-react` yang diimpor, import `@/…`, komponen JSX tak terdefinisi, `Inertia::render` vs file halaman, props halaman vs controller, dan render SSR 37 halaman (data normal dan data kosong/null) dengan penangkap warning React: 0 temuan
- **Diperbaiki:** props array/objek diberi nilai default aman di 21 halaman dan komponen (`DataTable`, `TimelineRiwayat`); ikon marker Leaflet dimemoize
- **Catatan:** Peta (Leaflet) tidak bisa di-SSR sehingga hanya terverifikasi lewat build

