# UI-POLISH — Rencana Perbaikan Antarmuka SIMBANGDES

> **Cakupan:** hanya `resources/css/` dan `resources/js/`. **Dilarang** mengubah controller, migration, route, Form Request, atau service. Semua perubahan bersifat visual/UX; nama prop Inertia yang dikirim backend tetap dipakai apa adanya.
>
> **Verifikasi tiap tahap:** `npm run build` sukses, `php artisan test` tetap hijau (test Inertia memeriksa nama komponen & prop, bukan kelas CSS), lalu cek visual di 375px / 768px / 1280px.

---

## 0. Temuan Audit (kondisi saat ini)

| # | Area | Temuan | Dampak |
| :--- | :--- | :--- | :--- |
| A-01 | `app.css` + Leaflet | `leaflet.css` di-import **tanpa layer**, sedangkan utilitas Tailwind v4 berada di `@layer utilities`. CSS tanpa layer selalu menang atas CSS ber-layer, sehingga `.leaflet-container a { color: #0078A8 }` dan `.leaflet-container { font: 12px "Helvetica Neue"… }` mengalahkan kelas Tailwind | Tautan "Lihat detail" di popup tampil **biru**, bukan merah; font popup bukan Plus Jakarta Sans; `StatusBadge` di popup ikut berubah |
| A-02 | `app.css` + Leaflet | Preflight Tailwind v4 (`img { max-width:100%; height:auto; display:block }`) berpotensi merusak ubin/marker. Saat ini masih aman karena `leaflet.css` 1.9.4 sudah punya `max-width: none !important` untuk `.leaflet-tile` & pane marker, tetapi aman hanya karena urutan import | Rapuh: ubin bisa terpotong/bergaris jika urutan import berubah atau leaflet.css dimasukkan ke layer |
| A-03 | `Peta.jsx` | Leaflet memakai z-index 400 (pane) s.d. 1000 (kontrol). Isolasi saat ini hanya bergantung pada kelas `z-0` + `position: relative` yang ditambahkan Leaflet lewat JS | Kontrol zoom bisa menembus `FlashToast` (`z-50`) dan drawer mobile (`z-40`) bila isolasi hilang |
| A-04 | `Peta.jsx` | Tinggi peta `h-[28rem]` (448px), tanpa `min-h`; `invalidateSize()` tidak pernah dipanggil; prop `center` dan `bounds` dikirim bersamaan | Peta bisa abu-abu/terpotong sebagian setelah navigasi Inertia atau perubahan ukuran layout; tampilan awal kurang konsisten |
| A-05 | `Peta.jsx` | Atribusi hanya "© OpenStreetMap" tanpa tautan "contributors" | Tidak sesuai ketentuan atribusi OSM |
| A-06 | Ikon marker | Impor eksplisit `marker-icon*.png` + `mergeOptions` sudah benar; build menghasilkan `marker-icon-*.png`, `marker-icon-2x-*.png`, `marker-shadow-*.png` di `public/build/assets` | ✅ Sudah benar, cukup dipertahankan & diverifikasi visual |
| A-07 | Font | `vite.config.js` hanya memuat Plus Jakarta Sans 400/500/600/700, tetapi `font-extrabold` (800) dipakai di **14** tempat | Browser mensintesis tebal 800, sehingga huruf tampak kabur/tidak konsisten |
| A-08 | `BentoCard` | `rounded-2xl`, `shadow-sm`, `p-5 lg:p-6`; grid `grid-cols-12` di semua ukuran layar | Kurang lega dibanding target desain; tidak ada langkah tablet (`md`) |
| A-09 | KPI duplikat | Kartu angka KPI ditulis ulang di 4 tempat dengan gaya berbeda: `Kpi` (Pemdes Dashboard), `Stat` (Home), inline (Admin & Pelaksana Dashboard, Transparansi). Komponen `StatCard` **belum ada** | Hierarki tipografi tidak seragam (`text-2xl font-extrabold` vs `text-3xl`, label `text-slate-500` tanpa `tracking-wider`) |
| A-10 | `StatusBadge` | `px-2.5 py-0.5 font-semibold ring-1 ring-inset` | Belum sesuai standar pill lembut `px-3 py-1 text-xs font-medium` |
| A-11 | Input & checkbox | `focus:ring-red-600` tanpa lebar ring (Tailwind v4 tanpa plugin forms tidak menggambar ring), sehingga fokus keyboard nyaris tak terlihat. Checkbox Login memakai `rounded text-red-600` yang tidak berefek tanpa plugin forms | Aksesibilitas fokus buruk; checkbox tetap biru bawaan browser |
| A-12 | `Login.jsx` | Mendefinisikan ulang kelas input sendiri (duplikat `inputClass` di `Field.jsx`) | Gaya input berbeda dari form lain |
| A-13 | Tabel | `Pemdes/Pengaduan/Index.jsx` merender `<table>` **tanpa** pembungkus `overflow-x-auto`; select filter `w-48` kaku | Tabel meluber horizontal di 375px |
| A-14 | Chart.js | Tidak ada `ChartJS.defaults` global: font chart = Helvetica bawaan, warna grid default, legend doughnut di atas memakan tinggi. Label sumbu-X berisi nama proyek panjang tidak dipotong. `Transparansi.jsx` menampilkan **semua** proyek dalam satu bar chart | Grafik tampak "asing" dari UI, label bertumpuk di mobile, dan chart Transparansi tak terbaca saat proyek > 15 |
| A-15 | Chart Pelaksana | Tinggi dinamis `proyek.length * 56` tanpa batas atas | Kartu bisa sangat tinggi jika proyek banyak |
| A-16 | `PublicLayout` | Navbar 5 tautan dalam baris `overflow-x-auto` di mobile tanpa petunjuk bisa digeser; header tidak sticky | Tautan terakhir tersembunyi di 375px tanpa isyarat |
| A-17 | `AuthenticatedLayout` | Drawer mobile tidak menutup dengan `Esc` dan tidak mengunci scroll body; tidak ada `aria-current` pada menu aktif; menu aktif memakai blok merah penuh | UX & aksesibilitas; merah terlalu dominan (bertentangan dengan prinsip "merah hanya untuk aksi utama") |
| A-18 | Aksen merah | Hero merah penuh dipakai di Home dan Login, ditambah item menu aktif merah, progress bar merah, angka realisasi merah | Merah terlalu banyak; sorotan kehilangan makna |
| A-19 | Tanggal | Tanggal mentah `slice(0, 10)` (format `2026-11-21`) di banyak halaman | Kurang ramah warga; idealnya `21 Nov 2026` (`toLocaleDateString('id-ID')`) |

---

## 1. Perbaikan Bug Leaflet Maps (Wajib Tuntas)

### 1.1 `resources/css/app.css`
```css
@import 'tailwindcss';
/* Masukkan leaflet ke layer components: utilitas Tailwind tetap menang (A-01),
   sementara aturan !important milik Leaflet tetap berlaku. */
@import 'leaflet/dist/leaflet.css' layer(components);

@layer components {
    /* Jaring pengaman preflight Tailwind v4 (A-02) */
    .leaflet-container img,
    .leaflet-tile {
        max-width: none !important;
        max-height: none !important;
    }
    .leaflet-container {
        font-family: var(--font-sans);
        /* Stacking context sendiri: z-index internal Leaflet (400–1000) tidak menembus navbar/sidebar/toast (A-03) */
        isolation: isolate;
        z-index: 0;
    }
    .leaflet-container a { color: var(--color-red-600); }
    .leaflet-popup-content-wrapper { border-radius: 1rem; box-shadow: 0 10px 30px -10px rgb(15 23 42 / 0.25); }
    .leaflet-popup-content { margin: 0.875rem 1rem; }
}
```
- [ ] Pastikan `@import` leaflet tetap **di baris paling atas** (sebelum `@source`/`@theme`), sesuai aturan CSS `@import`.
- [ ] Hierarki z-index dikunci: peta `0` < header publik `z-20` < header panel `z-20` / sidebar `z-30` < drawer mobile `z-40` < `FlashToast` `z-50`.

### 1.2 Komponen peta baru `resources/js/Components/PetaProyek.jsx`
Pindahkan logika peta dari `Pages/Public/Peta.jsx` ke komponen agar bisa dipakai ulang (misalnya mini-map di Detail Proyek):
- [ ] Impor ikon eksplisit (pertahankan pola A-06) di **level modul komponen**, cukup sekali:
  `import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'` dan seterusnya, lalu `L.Icon.Default.mergeOptions({...})`. Tambahkan juga `delete L.Icon.Default.prototype._getIconUrl;` agar Leaflet tidak menebak path dari CSS.
- [ ] Kontainer: `className="h-[60vh] min-h-[480px] w-full rounded-2xl"` (tinggi eksplisit, A-04).
- [ ] Komponen anak `<PasDenganData titik={titik} />` yang memakai `useMap()`:
  - `useEffect` → `map.invalidateSize()` setelah mount (bungkus `requestAnimationFrame`/`setTimeout(…, 0)` agar layout sudah final).
  - `fitBounds(titik, { padding: [40, 40], maxZoom: 15 })` bila ≥ 1 titik; jangan kirim `center` dan `bounds` bersamaan.
  - `ResizeObserver` pada kontainer → `invalidateSize()` (menangani sidebar/drawer & rotasi layar).
- [ ] Atribusi: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors` (A-05).
- [ ] Popup: nama proyek (`font-semibold text-slate-900`), `StatusBadge`, mini progress bar, tautan "Lihat detail →" (`text-red-600`).
- [ ] Empty state bila `proyek.length === 0`: kartu "Belum ada proyek berkoordinat" (peta tetap tampil di zoom Indonesia).
- [ ] **Verifikasi:** `npm run build`, lalu pastikan `marker-icon-*.png`, `marker-icon-2x-*.png`, `marker-shadow-*.png` ada di `public/build/assets`; buka `/peta` → ubin utuh tanpa celah, marker & bayangan tampil, kontrol zoom berada di bawah toast, popup bertautan merah.

---

## 2. Standar Desain Bento Box Grid Modern (Merah – Putih – Slate)

### 2.1 Token & kanvas
- Kanvas halaman: `bg-slate-50` (sudah ada di `<body>` dan layout, pertahankan).
- `@theme` tambahan di `app.css`:
  ```css
  --shadow-bento: 0 2px 10px -3px rgb(15 23 42 / 0.06);
  ```
  sehingga kartu cukup memakai `shadow-bento`.
- Font: ganti seluruh `font-extrabold` dengan `font-bold` (A-07). **Tidak** menambah bobot 800 di `vite.config.js`, karena itu di luar `resources/` dan menambah ukuran unduhan.

### 2.2 Grid
`BentoGrid` →
```
grid grid-cols-1 gap-5 md:grid-cols-6 lg:grid-cols-12
```
> ⚠️ **Jebakan migrasi:** di `grid-cols-1`, kelas tanpa prefiks seperti `col-span-6` atau `col-span-12` membuat **kolom implisit** sehingga layout mobile rusak. Semua pemakaian harus diubah ke pola berikut:

| Peran kartu | Kelas baru |
| :--- | :--- |
| Lebar penuh | `md:col-span-6 lg:col-span-12` (mobile otomatis 1 kolom) |
| Hero | `md:col-span-6 lg:col-span-8` |
| Highlight / Metric besar | `md:col-span-6 lg:col-span-4` |
| KPI kecil (4 sejajar) | `md:col-span-3 lg:col-span-3` |
| KPI (3 sejajar) | `md:col-span-2 lg:col-span-4` |
| Chart | `md:col-span-6 lg:col-span-7` |
| Feed / List | `md:col-span-6 lg:col-span-5` |

Hindari halaman yang seluruhnya `lg:col-span-12` bertumpuk. Setiap halaman minimal punya satu baris asimetris (8/4 atau 7/5).

### 2.3 Komponen kartu
- `BentoCard`: `rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.06)]`. Tambahkan prop opsional `action` (elemen di kanan header, mis. tautan "Lihat semua") dan `variant="dark"` (`bg-slate-900 border-slate-800 text-white`) untuk kartu sorotan, menggantikan trik `[&_h2]:text-white` di Home.
- **`StatCard` baru** (`resources/js/Components/StatCard.jsx`), menggantikan `Kpi`, `Stat`, dan KPI inline (A-09):
  ```jsx
  <BentoCard className={className}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{children}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
  </BentoCard>
  ```
  Prop: `label`, `hint`, `icon` (lucide, `h-5 w-5 text-slate-400` di pojok kanan), `tone` (`default` | `danger` untuk angka merah, hanya untuk "Terlambat"/risiko).
- **`ProgressBar` baru** (`Components/ProgressBar.jsx`): `h-2 rounded-full bg-slate-100` + isi `bg-slate-800`; merah (`bg-red-600`) hanya bila status `Terlambat`. Menggantikan 5 progress bar inline di Home, Katalog, Detail, Peta.
- `StatusBadge`: `rounded-full px-3 py-1 text-xs font-medium` + warna lembut (`bg-emerald-50 text-emerald-700`, dst.) dengan titik warna `before:` 6px. Hapus `ring-1` (A-10).
- `Field.jsx` / `inputClass`: `rounded-xl border-slate-300 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20` (A-11). Tambahkan `tombolSekunder` (`bg-white border-slate-200 text-slate-700`) dan `tombolTeks` untuk aksi non-utama.
- Checkbox & file input: `accent-red-600` (A-11); file input memakai `file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium`.
- `Pagination`: pill `rounded-full`, aktif `bg-slate-900 text-white` (merah dikhususkan untuk aksi utama).
- `FlashToast`: `rounded-2xl`, `shadow-bento`, posisi `top-20` di panel agar tidak menutup topbar.
- Komponen kecil baru `EmptyState.jsx` (ikon + teks `text-sm text-slate-500`) untuk menggantikan ±12 paragraf "Belum ada …" yang ditulis inline.
- Helper `formatTanggal` di `MoneyFormat.jsx` (atau `Components/format.js`): `toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })` (A-19).

### 2.4 Aturan aksen merah (A-18)
Merah **hanya** untuk: tombol aksi utama (`bg-red-600 hover:bg-red-700 text-white`), angka/ status kritis (Terlambat, Kritis, Ditolak), logo, dan indikator menu aktif (garis/ titik, bukan blok penuh). Hero diganti kartu putih dengan aksen merah kecil (eyebrow `text-red-600`) atau kartu `slate-900`. Bar "Realisasi" di chart tetap merah sebagai satu-satunya warna sorotan; "Pagu" memakai `slate-300`.

### 2.5 Chart.js global (A-14)
File baru `resources/js/chartSetup.js`, diimpor sekali oleh setiap halaman ber-chart (menggantikan `ChartJS.register(...)` yang diulang di 4 halaman):
- `ChartJS.defaults.font.family = 'Plus Jakarta Sans, ui-sans-serif, sans-serif'`, `font.size = 12`, `color = '#64748b'`.
- `defaults.borderColor = '#f1f5f9'` (grid halus); `scale.grid.drawTicks = false`; sumbu tanpa garis border.
- `plugins.legend.position = 'bottom'`, `labels.usePointStyle = true`, `boxWidth = 8`.
- `plugins.tooltip`: latar `#0f172a`, `cornerRadius 8`, `padding 10`.
- `elements.bar.borderRadius = 6`, `maxBarThickness = 28`; `elements.arc.borderWidth = 0`; doughnut `cutout: '70%'` dengan angka total di tengah (label HTML absolut di atas kanvas).
- `layout.padding = 8`; setiap wrapper chart `relative h-72 w-full` + `min-w-0` pada kartu agar kanvas tidak meluber dari grid.
- Label kategori panjang dipotong lewat `ticks.callback` (`label.length > 14 ? label.slice(0, 13) + '…' : label`); nama lengkap tetap tampil di tooltip.
- Satu palet bersama (`slate-800`, `red-600`, `amber-500`, `emerald-500`, `blue-500`, `slate-300`) diekspor dari `chartSetup.js`, menggantikan `WARNA_STATUS`, `WARNA`, dan `WARNA_ROLE` yang tersebar.

---

## 3. Daftar File yang Akan Dirombak per Tahap

### Tahap A — Fondasi, komponen inti, peta, layout
| File | Perubahan |
| :--- | :--- |
| `resources/css/app.css` | Layer leaflet, jaring pengaman ubin, isolasi z-index, `--shadow-bento` (§1.1, §2.1) |
| `Components/BentoCard.jsx` | `BentoGrid` responsif 1/6/12 + `gap-5`; kartu `rounded-3xl p-6 shadow-bento`; prop `action`, `variant` |
| `Components/StatCard.jsx` *(baru)* | KPI standar (§2.3) |
| `Components/ProgressBar.jsx` *(baru)* | Progress bar seragam |
| `Components/EmptyState.jsx` *(baru)* | Empty state seragam |
| `Components/StatusBadge.jsx` | Pill lembut + titik warna |
| `Components/Field.jsx` | Ring fokus terlihat, `accent-red-600`, tombol sekunder/teks, gaya file input |
| `Components/Pagination.jsx` | Pill, aktif slate-900 |
| `Components/FlashToast.jsx` | Radius & bayangan baru, offset di bawah topbar |
| `Components/MoneyFormat.jsx` | Tambah `formatTanggal` |
| `Components/PetaProyek.jsx` *(baru)* | Peta Leaflet + `invalidateSize` + `fitBounds` + ikon (§1.2) |
| `resources/js/chartSetup.js` *(baru)* | Default Chart.js global + palet (§2.5) |
| `Layouts/PublicLayout.jsx` | Header putih `sticky top-0 z-20` + garis bawah, logo merah; desktop: tautan horizontal dengan indikator aktif merah (garis bawah); mobile (< `lg`): tombol menu → panel dropdown penuh (menggantikan baris scroll A-16); tombol "Login Internal" `bg-red-600`. Footer `slate-900` tiga kolom (identitas · tautan · kontak/hak cipta) yang menumpuk di mobile |
| `Layouts/AuthenticatedLayout.jsx` | Sidebar `slate-900` dengan menu aktif `bg-white/10 text-white` + garis kiri merah 3px dan `aria-current="page"`; label grup per role; topbar putih `h-16` berisi judul + avatar inisial (lingkaran `slate-900`) + nama/role (role disembunyikan di < `sm`); drawer: tutup dengan `Esc`, kunci scroll body, fokus ke tombol tutup (A-17); konten `max-w-7xl mx-auto` |

### Tahap B — Portal Publik
| Halaman | Rencana tata letak Bento |
| :--- | :--- |
| `Public/Home.jsx` (Beranda) | Baris 1: Hero putih `lg:col-span-8` (eyebrow merah, judul `text-4xl font-bold`, 2 CTA: "Katalog Proyek" merah + "Lihat Peta" sekunder) · kartu Pengaduan `variant="dark"` `lg:col-span-4`. Baris 2: 4 × `StatCard`. Baris 3: Serapan anggaran `lg:col-span-7` (3 angka + `ProgressBar` besar) · pratinjau peta/tautan peta `lg:col-span-5`. Baris 4: Proyek terbaru `lg:col-span-12` (grid kartu 1/2/3) |
| `Public/Proyek/Index.jsx` (Katalog) | Kartu filter `lg:col-span-12` dengan input pencarian berikon `Search` + 3 select; di mobile filter menumpuk 1 kolom, tombol "Cari" lebar penuh. Hasil: kartu proyek `md:col-span-3 lg:col-span-4` dengan kategori sebagai chip slate, `ProgressBar`, dan tahun anggaran. Tampilkan jumlah hasil & `EmptyState` |
| `Public/Proyek/Show.jsx` (Detail) | Breadcrumb · Hero info `lg:col-span-8` · Progres `lg:col-span-4` (angka `text-5xl font-bold` + target) · Anggaran 3 × `StatCard` · Galeri `lg:col-span-7` (tab/segmen Sebelum–Saat–Sesudah, thumbnail `aspect-[4/3] object-cover rounded-2xl`, klik untuk perbesar via `<dialog>`) · Riwayat `lg:col-span-5` (timeline titik + `formatTanggal`) · opsional mini-map `PetaProyek` bila berkoordinat |
| `Public/Peta.jsx` | Header kartu (judul + jumlah titik + legenda warna status) `lg:col-span-12` · `PetaProyek` `lg:col-span-9` · daftar proyek bergulir `lg:col-span-3` (klik untuk terbang ke marker; di mobile pindah ke bawah peta) |
| `Public/Transparansi.jsx` | 3 × `StatCard` (Pagu, Realisasi, Sisa) + kartu persentase serapan total · Chart `lg:col-span-7` hanya **10 pagu terbesar** (dipotong di frontend, tanpa ubah backend; A-14) · Doughnut realisasi vs sisa `lg:col-span-5` · Tabel rincian `lg:col-span-12` dengan `overflow-x-auto`, kolom angka rata kanan `tabular-nums`, mini progress per baris |
| `Public/Pengaduan/Create.jsx` | Kartu sukses tiket (hijau, tombol "Salin kode" via `navigator.clipboard`) `lg:col-span-12` · Form `lg:col-span-8` (2 kolom di `md`, CAPTCHA dalam kotak `bg-slate-50 rounded-2xl` dengan tombol ganti berikon `RefreshCw`) · Samping `lg:col-span-4`: cara kerja (3 langkah bernomor) + tautan cek tiket + catatan privasi |
| `Public/Pengaduan/Cek.jsx` | Form pencarian `lg:col-span-5` (input `font-mono uppercase`) · Hasil `lg:col-span-7`: stepper status Menunggu → Diproses → Selesai/Ditolak, kotak tanggapan `bg-slate-50`, tanggal via `formatTanggal`; status tidak ditemukan memakai `EmptyState` |

### Tahap C — Panel internal & Login
| Halaman | Rencana |
| :--- | :--- |
| `Auth/Login.jsx` | Layout dua panel: kiri kartu `slate-900` berisi logo, nama sistem, 3 poin fitur, dan tautan portal; kanan form putih. Pakai `Field`/`inputClass` (hapus duplikat A-12), checkbox `accent-red-600`, tombol merah penuh, toggle tampil-sandi berikon `Eye`. Di mobile panel kiri menyusut jadi header ringkas |
| `Pemdes/Dashboard.jsx` | 4 KPI status (`StatCard`, "Terlambat" `tone="danger"`) · 3 KPI uang `md:col-span-2 lg:col-span-4` · Chart Pagu vs Realisasi `lg:col-span-7` · Doughnut status `lg:col-span-5` (total di tengah) · Laporan menunggu `lg:col-span-7` & Proyek berisiko `lg:col-span-5` dengan `action="Lihat semua"` |
| `Pelaksana/Dashboard.jsx` | 3 KPI (Ditugaskan, Aktif, Perlu Revisi) · Progres per proyek `lg:col-span-7`; tinggi `clamp(220px, n*44px, 480px)` + scroll internal bila lebih (A-15) · Doughnut status laporan `lg:col-span-5` · Daftar "Perlu Revisi" `lg:col-span-12` dengan tombol "Perbaiki" sekunder |
| `Admin/Dashboard.jsx` | 3 `StatCard` · Line login harian `lg:col-span-8` (area fill merah 10% opacity, titik disembunyikan) · Doughnut role `lg:col-span-4` · Feed aktivitas `lg:col-span-12` dengan avatar inisial + waktu relatif |
| `Pemdes/Proyek/Index.jsx`, `Pemdes/Monitoring/Index.jsx`, `Pemdes/Laporan/Index.jsx`, `Pemdes/Pengaduan/Index.jsx`, `Admin/Users/Index.jsx`, `Admin/Audit/Index.jsx`, `Pelaksana/Laporan/Index.jsx` | Pola tabel seragam: toolbar filter di header kartu (`action`), `overflow-x-auto` **wajib** (perbaiki A-13 di Pengaduan), `thead` `text-xs uppercase tracking-wider text-slate-400`, baris `hover:bg-slate-50`, aksi kanan sebagai tombol teks; di < `md` tabel Pengaduan & Laporan beralih ke daftar kartu |
| `Pemdes/Proyek/Form.jsx`, `Pemdes/Anggaran/Show.jsx`, `Pemdes/Pengaduan/Show.jsx`, `Pelaksana/Proyek/*`, `Pelaksana/Laporan/Form.jsx`, `Admin/Users/Form.jsx`, `Admin/Backup/Index.jsx`, `Profile/Edit.jsx` | Form 8/4 atau 7/5 (data utama · panel samping), tombol aksi di footer kartu (`border-t pt-4`), pratinjau foto `aspect-[4/3] rounded-2xl`; `Anggaran/Show` memakai 3 `StatCard` + `ProgressBar` serapan |

---

## 4. Urutan Kerja & Definisi Selesai

1. **Tahap A** (paling berisiko karena dipakai semua halaman). Setelah `BentoGrid` diubah, sapu semua `col-span-*` tanpa prefiks: `grep -rn '"col-span-\|\scol-span-' resources/js`.
2. **Tahap B**, lalu cek visual `/`, `/proyek`, `/proyek/{id}`, `/peta`, `/transparansi`, `/pengaduan`, `/pengaduan/cek`.
3. **Tahap C**, lalu login sebagai `pemdes`, `pelaksana`, `admin` (akun demo, sandi `password`) dan cek setiap menu.

Setiap tahap dianggap selesai bila:
- [ ] `npm run build` sukses tanpa warning baru
- [ ] `php artisan test` hijau (62 test)
- [ ] Tidak ada scroll horizontal halaman di 375px; grid 2–3 kolom di 768px; asimetris 8/4 · 7/5 di 1280px
- [ ] Tidak ada sisa `font-extrabold`, `rounded-2xl` pada kartu, atau `ChartJS.register` lokal
- [ ] Fokus keyboard terlihat di semua input, tombol, dan menu
- [ ] `PROGRESS.md` diperbarui (log sesi UI Polish) & `graphify update .`
