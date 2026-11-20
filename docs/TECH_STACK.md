# Technology Stack & UI Design System
## SIMBANGDES — Sistem Informasi Manajemen Pembangunan dan Transparansi Desa

Dokumen ini menetapkan versi perangkat lunak, pustaka pihak ketiga, konfigurasi lingkungan server, dan pedoman antarmuka pengguna (*Design System*) yang wajib digunakan dalam pengembangan **SIMBANGDES**.

---

## 1. Tumpukan Teknologi Utama (*Core Stack*)

| Lapisan | Teknologi | Versi Minimum / Target | Peran & Alasan Pemilihan |
| :--- | :--- | :--- | :--- |
| **Bahasa Pemrograman Backend** | PHP | `v8.4` | Mendukung *typed properties*, *enums*, atribut, dan performa optimal untuk Laravel 13. |
| **Backend Framework** | Laravel | `v13.x` | Menyediakan routing MVC, Eloquent ORM, Blade root template, validasi *Form Request*, dan *Middleware* RBAC. |
| **SPA Bridge** | Inertia.js (`inertiajs/inertia-laravel` & `@inertiajs/react`) | `v2.x` | Menghubungkan Laravel dengan React tanpa perlu membangun dan memelihara REST API/GraphQL terpisah. |
| **Frontend Library** | React.js | `v19.x` | Membangun komponen antarmuka interaktif yang reaktif dan modular. |
| **CSS Framework** | Tailwind CSS | `v4.x` (konfigurasi CSS-first via `@theme`, tanpa `tailwind.config.js`) | Styling berbasis *utility-first* untuk memastikan konsistensi responsif di desktop, tablet, dan ponsel. |
| **Build Tool** | Vite | `v8.x` | Bundling aset JavaScript/CSS dan *Hot Module Replacement* (HMR) saat pengembangan. |
| **Database Server** | MySQL / MariaDB | MySQL `v8.0+` / MariaDB `v10.6+` | Penyimpanan data relasional dengan mesin `InnoDB` untuk transaksi ACID. |

---

## 2. Pustaka & Layanan Pendukung (*Dependencies*)

### 2.1 Backend Packages (`composer.json`)
* **`barryvdh/laravel-dompdf` (`^2.0`):** Menghasilkan dokumen laporan pertanggungjawaban proyek dan rekapitulasi anggaran ke format PDF dari tampilan HTML/Blade.
  * *Konfigurasi Wajib:* Set `'isRemoteEnabled' => false` pada `config/dompdf.php` untuk mencegah serangan *Server-Side Request Forgery* (SSRF).
* **`intervention/image` (`^3.0`):** Mengompresi dan mengubah dimensi foto dokumentasi lapangan serta bukti transaksi secara otomatis sebelum disimpan ke disk agar hemat ruang penyimpanan dan cepat dimuat.
* **`mews/captcha` (`^3.3`) atau Google reCAPTCHA:** Melindungi formulir pengaduan publik dari pengiriman otomatis (*spam bot*).
* **`tightenco/ziggy` (`^1.8` / `^2.0`):** Mengekspos rute bernama (*named routes*) Laravel agar dapat dipanggil langsung di komponen React melalui helper `route()`.

### 2.2 Frontend Packages (`package.json`)
* **`leaflet` & `react-leaflet`:** Menampilkan peta geografis interaktif untuk sebaran titik koordinat proyek desa menggunakan *tile* gratis dari **OpenStreetMap** (tanpa ketergantungan kunci API berbayar).
* **`chart.js` & `react-chartjs-2` (atau `recharts`):** Merender grafik batang (*bar chart*) perbandingan pagu vs. realisasi anggaran serta grafik donat (*doughnut chart*) status proyek pada *Dashboard* dan *Portal Transparansi*.
* **`lucide-react`:** Pustaka ikon vektor ringan dan konsisten untuk navigasi sidebar, kartu metrik, serta indikator status.

---

## 3. Pedoman Sistem Desain UI (*Design System*)

Seluruh komponen antarmuka (baik halaman publik maupun internal aparatur) wajib mematuhi standar visual berikut:

### 3.1 Palet Warna Resmi (*Brand Identity*)
* **Warna Primer (Aksen Utama & Identitas Pemerintahan Desa):** Merah (`#DC2626` / Tailwind `red-600`, dengan variasi *hover* `#B91C1C` / `red-700`). Digunakan untuk tombol aksi utama, *header* sorotan, dan indikator aktif.
* **Warna Latar Utama:** Putih (`#FFFFFF`) dan Abu-abu Sangat Terang (`#F8FAFC` / Tailwind `slate-50`) untuk area konten utama guna menjaga keterbacaan tinggi.
* **Warna Gelap & Sidebar Internal:** Abu-abu Gelap / Slate (`#1E293B` / Tailwind `slate-800` dan `#0F172A` / `slate-900`) untuk teks utama dan navigasi samping pada panel internal (`Admin`, `Pemdes`, `Pelaksana`).
* **Warna Semantik Status:**
  * **Sesuai Target / Disetujui / Selesai:** Hijau (`#16A34A` / `emerald-600`)
  * **Waspada Deviasi / Menunggu Verifikasi:** Kuning / Amber (`#D97706` / `amber-600`)
  * **Terlambat / Kritis / Ditolak:** Merah (`#DC2626` / `red-600`)
  * **Informasi / Berjalan:** Biru (`#2563EB` / `blue-600`)

### 3.2 Tipografi & Tata Letak Responsif
* **Font Keluarga:** `Inter` atau `Plus Jakarta Sans` (sans-serif) dengan `tabular-nums` pada tampilan angka nominal Rupiah dan persentase progres agar kolom tabel sejajar rapi.
* **Breakpoints Responsif:**
  * Mobile: `< 640px` (*hamburger menu* pada publik, *collapsible drawer sidebar* pada internal).
  * Tablet: `768px` – `1024px` (grid 2 kolom untuk kartu metrik).
  * Desktop: `>= 1280px` (grid 4 kolom untuk kartu metrik, tata letak penuh).

---

## 4. Spesifikasi Lingkungan Server & Konfigurasi (`.env`)

### 4.1 Persyaratan Server Produksi
* **Web Server:** Nginx atau Apache2 dengan modul `mod_rewrite` aktif dan sertifikat **SSL/TLS (HTTPS)** wajib aktif.
* **Ekstensi PHP Wajib:** `bcmath`, `ctype`, `curl`, `dom`, `fileinfo`, `gd` (atau `imagick`), `json`, `mbstring`, `openssl`, `pdo_mysql`, `tokenizer`, `xml`.
* **Storage Symbolic Link:** Wajib menjalankan perintah `php artisan storage:link` agar berkas foto di `storage/app/public` dapat diakses melalui `/storage/...`.

### 4.2 Variabel Lingkungan Kunci
Pastikan konfigurasi `.env` pada lingkungan produksi mengatur parameter keamanan berikut:
```env
APP_NAME=SIMBANGDES
APP_ENV=production
APP_DEBUG=false
APP_TIMEZONE=Asia/Makassar

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pplproject

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=true
SESSION_HTTP_ONLY=true
SESSION_SECURE_COOKIE=true
```