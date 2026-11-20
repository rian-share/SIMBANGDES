# DESIGN-SYSTEM — Perombakan Total Antarmuka SIMBANGDES

> **Status:** cetak biru, belum ada kode yang diubah. Disusun 2026-11-22 (Sesi 10), setelah Fitur Pemdes Ekstra (`PROGRESS.md`: 86 test hijau).
>
> **Batas keras sesi perombakan:** hanya `resources/views/app.blade.php`, `resources/css/app.css`, `resources/js/**`, dan satu baris di `vite.config.js` (lepas font Bunny, §1.2). **Tidak ada** perubahan controller, route, request, model, migration, atau test PHP. Nama komponen halaman Inertia (`Pemdes/Proyek/Show`, dst.) dan bentuk props **tidak berubah**, sehingga 86 test tetap hijau tanpa disentuh.
>
> **Menggantikan:** `UI-POLISH.md` §2 (token, grid, kartu, chart). Bila bertentangan, dokumen ini yang berlaku.

---

## 0. Diagnosis — Mengapa UI Terasa Kaku dan "AI Slop"

Hasil audit `resources/js/` (47 file):

| # | Gejala | Bukti di kode | Aturan pengganti |
| :--- | :--- | :--- | :--- |
| D-1 | Blok `slate-900` besar merusak proporsi warna | Sidebar panel `bg-slate-900` (±20% layar 1280px), kartu `variant="dark"` di Home, Statistik, Login, Detail Proyek Pemdes | §1.1 (90–8–2), §4.1 sidebar putih |
| D-2 | Label "eyebrow" `text-xs uppercase tracking-wider text-slate-400` di hampir setiap kartu dan KPI | 56 pemakaian `text-slate-400`. Kontras 2,6:1 **gagal WCAG AA** untuk teks kecil | §1.3: label kalimat biasa `text-slate-500`, uppercase hanya untuk 1 eyebrow per halaman |
| D-3 | Judul ganda dan bertele-tele | Judul di topbar ("Keuangan — Anggaran") + judul kartu ("Daftar Proyek") + kartu berjudul "Filter" | §3.2 `PageHeader` satu-satunya judul halaman, filter masuk header tabel |
| D-4 | Angka rupiah berisik dan meluber di 375px | `formatRupiah` selalu `,00`; KPI `text-3xl` berisi "Rp 150.000.000,00" | §3.13 `formatRupiah` tanpa sen nol + mode ringkas untuk KPI |
| D-5 | Warna pelangi di chart dan badge | `WARNA_STATUS` kuning/biru/hijau/merah di Dashboard; badge `Berjalan` biru | §5 palet chart 3 warna, §3.9 badge netral + titik semantik |
| D-6 | Tabel hanya di-*scroll*, tanpa tampilan mobile | 12 halaman `<table>` + `min-w-[...]` | §3.6 `DataTable` → kartu ringkas di bawah `md` |
| D-7 | Dialog bawaan browser | 5× `confirm()`; hapus proyek, transaksi, komponen, berita | §3.12 `Modal` + `useConfirm()` |
| D-8 | Panah teks dan entitas HTML | 7× `→`, `&larr;` | Ikon `ArrowRight` / `ArrowLeft` lucide |
| D-9 | Kartu berwarna status penuh | `bg-emerald-50` (sukses pengaduan), `bg-red-50` (catatan penolakan) | §3.14 `Callout` bergaris kiri, isi tetap putih |
| D-10 | Ikon dekoratif besar | `Megaphone h-8 text-red-500` di Home | Ikon hanya penanda (16/20px), tidak pernah ilustrasi |
| D-11 | Sudut dan bayangan terlalu "lembut" dan seragam | `rounded-3xl` + `shadow-bento` di semua kartu | §1.4 `rounded-2xl` + `shadow-card` mikro |
| D-12 | Peta dipaksa tinggi dan "di-*hack*" | `!p-3` pada kartu peta, `h-[60vh] min-h-[480px]`, scroll-wheel menjebak di mobile | §6 Leaflet full-bleed |
| D-13 | `dangerouslySetInnerHTML` di `Pagination` | Label paginator Laravel disuntik sebagai HTML | §3.6 paginasi dari `from/to/total` + ikon |
| D-14 | Hanya satu font; angka tidak `tabular-nums` di banyak tempat | `vite.config.js` memuat Plus Jakarta Sans via Bunny | §1.2 Inter + Plus Jakarta Sans |

---

## 1. Fondasi Visual

### 1.1 Proporsi warna 90–8–2

| Porsi | Peran | Token Tailwind | Hex |
| :--- | :--- | :--- | :--- |
| **90%** | Kanvas | `bg-slate-50` | `#F8FAFC` |
| | Permukaan kartu, sidebar, topbar, input | `bg-white` | `#FFFFFF` |
| | Garis tepi kartu/tabel | `border-slate-200/80`; pemisah baris `border-slate-100` | — |
| **8%** | Judul, angka utama | `text-slate-900` | `#0F172A` |
| | Teks isi | `text-slate-600` | `#475569` |
| | Meta, keterangan, header tabel (minimum untuk teks) | `text-slate-500` | `#64748B` |
| | Elemen struktural gelap (avatar, bar progres, data chart utama) | `bg-slate-800` / `bg-slate-900` | — |
| **2%** | Tombol aksi utama, indikator menu aktif, angka/status kritis, fokus | `bg-red-600 hover:bg-red-700`, `text-red-600`, `ring-red-600/20` | `#DC2626` / `#B91C1C` |

**Dilarang:**
- KPI berwarna-warni (biru/hijau/ungu/kuning), kotak ikon pastel bulat, latar gradien, kartu berlatar warna status.
- Lebih dari **satu** tombol `primary` merah per wilayah tampilan (header halaman, satu kartu form, satu modal).
- `text-slate-400` atau lebih terang untuk teks. Warna itu hanya boleh untuk ikon dan placeholder.
- Blok `bg-slate-900` di panel internal. Di portal publik maksimal **satu** kartu `inverse` per halaman (§3.3).

**Pengecualian semantik terbatas** (tidak dihitung pelanggaran):
- Titik status 6px di `StatusBadge`: `emerald-500` / `amber-500`.
- Teks `Selisih` hemat `text-emerald-600` (K-4 Fitur Pemdes Ekstra).
- Warna merah bawaan pesan error validasi.

### 1.2 Tipografi

**`resources/views/app.blade.php`** (di dalam `<head>`, sebelum `@vite`):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet">
```
- `<body class="bg-slate-50 font-sans text-slate-600 antialiased">`.
- Hapus blok `fonts: [bunny('Plus Jakarta Sans', …)]` dari `vite.config.js` agar font tidak dimuat dua kali. Ini satu-satunya perubahan di luar `resources/`.
- Catatan privasi: Google Fonts mengirim IP pengunjung ke Google. Bila desa keberatan, alternatifnya *self-host* lewat `@fontsource`, tetapi itu butuh dependensi baru dan persetujuan.

| Peran | Kelas | Contoh |
| :--- | :--- | :--- |
| Judul halaman (`PageHeader`) | `font-display text-2xl md:text-[28px] font-semibold tracking-tight text-slate-900` | "Anggaran" |
| Judul kartu | `font-display text-[15px] font-semibold tracking-tight text-slate-900` | "Serapan per proyek" |
| Nilai KPI | `text-2xl md:text-[28px] font-semibold tracking-tight tabular-nums text-slate-900` | "Rp 150 jt" |
| Teks isi | `text-sm leading-6 text-slate-600` | |
| Label form, header tabel | `text-[13px] font-medium text-slate-700` / `text-xs font-medium text-slate-500` | **bukan** uppercase |
| Meta | `text-xs text-slate-500` | "Diperbarui 2 jam lalu" |
| Eyebrow (maks. 1 per halaman, hanya `PageHeader`) | `text-xs font-semibold uppercase tracking-[0.08em] text-red-600` | "Portal transparansi desa" |

- Inter untuk semua teks isi. Plus Jakarta Sans **hanya** untuk heading (`font-display`).
- **Semua** rupiah, persentase, tanggal, jam, dan hitungan wajib `tabular-nums`. Helper §3.13 sudah membungkusnya.
- Gaya bahasa: kalimat biasa (*sentence case*) bahasa Indonesia baku, tanpa tanda seru, tanpa slogan ("Pantau pembangunan secara terbuka" boleh; "Wujudkan desa hebat!" tidak).

### 1.3 Ikonografi
- **Hanya `lucide-react`**, tanpa emoji di UI, label, atau `EmptyState`.
- Dibungkus global di `resources/js/app.jsx` (sudah tersedia di `lucide-react@1.77`):
  ```jsx
  import { LucideProvider } from 'lucide-react';
  // di setup(): <LucideProvider strokeWidth={1.75}><App {...props} /></LucideProvider>
  ```
- Ukuran: `h-4 w-4` untuk tombol, tabel, badge, dan input. `h-5 w-5` untuk navigasi, header, dan topbar. Warna ikon mengikuti teks (`text-slate-500`, aktif `text-slate-900`). Ikon tidak pernah merah kecuali di tombol primary atau status kritis.
- Ikon tanpa teks wajib punya `aria-label` (tombol) atau `aria-hidden="true"` (dekoratif).

### 1.4 Kedalaman, sudut, spasi

| Token | Nilai | Pemakaian |
| :--- | :--- | :--- |
| `shadow-card` | `0 1px 3px rgb(15 23 42 / 0.04), 0 1px 2px rgb(15 23 42 / 0.02)` | Semua kartu |
| `shadow-pop` | `0 12px 32px -12px rgb(15 23 42 / 0.18)` | **Hanya** dropdown, popover, modal, toast, popup peta |
| Sudut | `rounded-2xl` kartu · `rounded-xl` input, tombol, dropzone, thumbnail · `rounded-lg` item menu, tombol ikon · `rounded-full` badge, avatar, progress | |
| Padding kartu | `p-6 md:p-7`. Header kartu `mb-5` | |
| Jarak grid | `gap-5` (seragam di semua halaman) | |
| Lebar konten | `max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8` | |

Dilarang: `shadow-md` ke atas pada kartu, `rounded-3xl`, `ring` dekoratif, border tebal (`border-2`, kecuali dropzone putus-putus).

### 1.5 `resources/css/app.css` (target lengkap)
```css
@import 'tailwindcss';
@import 'leaflet/dist/leaflet.css' layer(components);

@source '../../vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php';
@source '../../storage/framework/views/*.php';
@source '../js/**/*.jsx';

@theme {
    --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
    --font-display: 'Plus Jakarta Sans', 'Inter', ui-sans-serif, sans-serif;
    --shadow-card: 0 1px 3px rgb(15 23 42 / 0.04), 0 1px 2px rgb(15 23 42 / 0.02);
    --shadow-pop: 0 12px 32px -12px rgb(15 23 42 / 0.18);
}

@layer base {
    html { -webkit-tap-highlight-color: transparent; }
    /* Tailwind v4: border default = currentColor; samakan dengan garis desain. */
    *, ::before, ::after { border-color: var(--color-slate-200); }
    :focus-visible { outline: 2px solid var(--color-red-600); outline-offset: 2px; }
    @media (prefers-reduced-motion: reduce) {
        *, ::before, ::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
}

@layer components { /* aturan Leaflet §6.3 */ }
```
`--shadow-bento` dihapus setelah Gelombang 3 (sampai saat itu dialiaskan ke nilai `--shadow-card`).

---

## 2. Arsitektur Bento Grid & Responsivitas

### 2.1 Grid
```
grid grid-cols-1 gap-5 md:grid-cols-6 lg:grid-cols-12
```
Span dipakai lewat prop `span` (`BentoCard`, `KpiCard`), bukan kelas manual, agar jebakan `col-span-*` tanpa prefiks tidak terulang:

| `span` | Kelas | Peran |
| :--- | :--- | :--- |
| `full` | `md:col-span-6 lg:col-span-12` | Tabel utama, galeri |
| `hero` | `md:col-span-6 lg:col-span-8` | Hero, form utama, info proyek |
| `highlight` | `md:col-span-6 lg:col-span-4` | Aksi cepat, ringkasan, form samping |
| `chart` | `md:col-span-6 lg:col-span-7` | Chart utama |
| `list` | `md:col-span-6 lg:col-span-5` | Feed, timeline, daftar pendek |
| `half` | `md:col-span-3 lg:col-span-6` | Dua kartu sejajar |
| `kpi4` | `md:col-span-3 lg:col-span-3` | 4 KPI sejajar |
| `kpi3` | `md:col-span-2 lg:col-span-4` | 3 KPI sejajar |

**Aturan komposisi:**
1. Setiap halaman minimal punya satu baris asimetris (8/4 atau 7/5).
2. Maksimal **satu** baris KPI per halaman, dan isinya maks. 4 kartu. Jangan menumpuk dua baris KPI (Dashboard Pemdes saat ini 7 KPI → dipadatkan, §7.3).
3. Halaman daftar (tabel) tidak boleh hanya berisi satu kartu `full`. Tambahkan baris ringkasan di atasnya (KPI atau 8/4: ringkasan + aksi) bila datanya tersedia di props. Bila tidak tersedia, cukup `PageHeader` + satu kartu tabel. **Jangan menambah props backend.**
4. Tinggi kartu dalam satu baris disamakan oleh grid (`items-stretch` bawaan). Isi kartu pendek memakai `flex flex-col` + `mt-auto` untuk aksi di bawah.

### 2.2 Breakpoint & pengecekan wajib

| Lebar uji | Breakpoint | Perilaku |
| :--- | :--- | :--- |
| **375px** | dasar | 1 kolom; tabel → kartu; filter → panel lipat; KPI 1 kolom (`kpi4` jadi 2 kolom via `grid-cols-2` khusus baris KPI, §3.4) |
| **768px** | `md` | Grid 6 kolom; tabel kembali menjadi tabel; sidebar masih *drawer* |
| **1280px** | `lg`/`xl` | Grid 12 kolom; sidebar tetap; konten maks. 1280px |

**0 horizontal overflow** di 375px. Aturan pencegahan:
- Setiap anak grid/flex yang berisi teks panjang: `min-w-0`. Judul dan nama proyek: `break-words`, sel tabel `truncate` + `title`.
- Tidak ada lebar tetap > 343px di bawah `md`.
- KPI rupiah memakai `formatRupiah(n, { ringkas: true })` dengan nilai penuh di atribut `title`.
- **Dilarang** menutup bug dengan `overflow-x-hidden` di `body`/`main`.
- Uji tiap halaman di DevTools dengan snippet konsol berikut. Hasilnya harus `[]`:
  ```js
  [...document.querySelectorAll('body *')].filter((el) => el.getBoundingClientRect().right > innerWidth + 1).map((el) => el.className)
  ```

---

## 3. Komponen UI (`resources/js/Components/UI/`)

Semua komponen baru berada di folder ini dan diekspor dari `Components/UI/index.js`. Komponen domain yang tetap di `Components/` (`PetaProyek`, `Lightbox`, `FormTransaksi`, `Selisih`, `TimelineRiwayat`, `GrafikRencanaRealisasi`, `ProgressBar`, `FlashToast`) dirombak agar **hanya** memakai primitif dari `UI/`.

**Strategi migrasi tanpa *big bang*:** di Gelombang 1, file lama diubah menjadi adaptor tipis ke komponen baru. Dengan begitu 47 halaman langsung mendapat tampilan baru tanpa diubah satu per satu:
- `BentoCard.jsx` → re-export `UI/BentoCard`
- `StatCard.jsx` → membungkus `KpiCard`
- `Field.jsx` → `inputClass` / `tombolMerah` / `tombolAbu` dipetakan ke kelas baru, dan `Field` membungkus `FormInput`/`FormSelect`/`FormTextarea` sesuai `as`
- `StatusBadge`, `EmptyState`, `Pagination` → re-export

Gelombang 2–3 mengganti pemakaian ke API baru. Adaptor dihapus di akhir Gelombang 3.

### 3.1 `Button`
`<Button variant="primary|secondary|ghost|danger" size="sm|md" icon={Plus} href? as? …>`
- Dasar: `inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none`. `md` = `h-10 px-4`, `sm` = `h-8 px-3 text-[13px]`.
- `primary`: `bg-red-600 text-white hover:bg-red-700`
- `secondary`: `border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900`
- `ghost`: `text-slate-600 hover:bg-slate-100 hover:text-slate-900`
- `danger`: `text-red-600 hover:bg-red-50` (pemicu hapus). Konfirmasi hapus di modal memakai `primary`.
- `href` → `<Link>` Inertia. `IconButton` (varian `ghost`, `h-8 w-8 rounded-lg`, wajib `label` → `aria-label` + `title`) untuk aksi baris tabel.

### 3.2 `PageHeader`
`<PageHeader eyebrow? title description? back={{ href, label }}? actions={<>…</>} />`
- Dirender di awal konten halaman, **di luar** `BentoGrid`: `mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between`.
- `back`: tautan `ArrowLeft` + label (`text-[13px] font-medium text-slate-500 hover:text-slate-900`) di atas judul.
- `actions`: maks. 1 `primary` + 2 `secondary`. Di mobile tombol menjadi `w-full sm:w-auto`.
- Prop `title` pada layout tetap dipakai, tetapi **hanya** untuk `<Head>`. Topbar panel tidak lagi menampilkan judul (D-3).

### 3.3 `BentoGrid` & `BentoCard`
- `BentoGrid({ className })`: grid §2.1.
- `BentoCard({ title, description, action, span, flush, variant, as = 'section', className })`
  - `default`: `min-w-0 rounded-2xl border border-slate-200/80 bg-white shadow-card`
  - `muted`: `bg-slate-50/60 border-slate-200/80 shadow-none` (info sekunder, catatan, "Cara kerja")
  - `inverse`: `bg-slate-900 border-slate-900 text-slate-300` (judul `text-white`), **hanya portal publik, maks. 1 per halaman**
  - Padding `p-6 md:p-7`. `flush` = `p-0 overflow-hidden` untuk peta, galeri, dan tabel tepi-ke-tepi.
  - Header: `title` (§1.2) + `description` (`text-sm text-slate-500 mt-1`). `action` di kanan (`Button size="sm" variant="ghost"` atau tautan `text-[13px] font-medium text-slate-600 hover:text-slate-900` + `ArrowRight h-4`). Tautan "Lihat semua" **tidak** merah (D-1).

### 3.4 `KpiCard` (minimalis ala Stripe/Linear)
`<KpiCard label value hint? delta={{ value, label }}? icon? tone="default|critical" span title? />`
```
┌──────────────────────────────┐
│ Total pagu              ⓘicon│  label 13px slate-500 · ikon 16px slate-400 (tanpa kotak)
│ Rp 450 jt                    │  nilai 24/28px semibold tabular-nums slate-900
│ 6 proyek · TA 2026           │  hint 12px slate-500
└──────────────────────────────┘
```
- `tone="critical"` hanya mengubah nilai menjadi `text-red-600` (Terlambat, Kritis, Perlu revisi > 0).
- `delta` opsional berupa teks kecil `text-xs`, tanpa panah berwarna kecuali kritis.
- Baris KPI dibungkus `<div className="contents">`, tidak ada wrapper khusus. Di bawah `md`, `kpi4` → `col-span-1` dalam grid 1 kolom. Untuk 4 KPI angka pendek boleh `grid-cols-2` lewat prop `compact` pada `BentoGrid`-baris (`grid-cols-2 md:grid-cols-6 lg:grid-cols-12`).

### 3.5 `StatusBadge` (soft pill + titik)
`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap`

| Kelompok | Status | Pill | Titik |
| :--- | :--- | :--- | :--- |
| Netral-berjalan | Berjalan, Diproses | `bg-slate-100 text-slate-700` | `bg-slate-900` |
| Menunggu | Perencanaan, Menunggu, Waspada | `bg-slate-100 text-slate-700` | `bg-amber-500` |
| Positif | Selesai, Disetujui, Aman | `bg-slate-100 text-slate-700` | `bg-emerald-500` |
| Kritis | Terlambat, Ditolak, Kritis | `bg-red-50 text-red-700` | `bg-red-600` |
| Lainnya | default, role, kategori | `bg-white border border-slate-200 text-slate-600` | tanpa titik |

Biru dihapus (D-5). Warna hanya di titik, kecuali status kritis.

### 3.6 `DataTable`
```jsx
<DataTable
    columns={[
        { key: 'nama_proyek', header: 'Proyek', primary: true, render: (r) => <Link …/> },
        { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status_proyek} /> },
        { key: 'pagu', header: 'Pagu', align: 'right', render: (r) => formatRupiah(r.anggaran?.pagu_anggaran) },
        { key: 'pelaksana', header: 'Pelaksana', hideBelow: 'lg' },
    ]}
    rows={proyek.data}
    rowKey="id"
    actions={(r) => [{ label: 'Ubah', icon: Pencil, href: … }, { label: 'Hapus', icon: Trash2, danger: true, onClick: … }]}
    toolbar={<FilterBar …/>}
    paginator={proyek}              // objek paginator Laravel: data, links, from, to, total
    empty={{ title: 'Belum ada proyek', action: <Button …/> }}
/>
```
- Dirender di dalam `BentoCard flush`. Toolbar mengisi baris atas kartu (`px-6 md:px-7 pt-6 pb-4`).
- **≥ `md`:** `<div className="overflow-x-auto">` + `<table className="w-full text-sm">`.
  - `thead`: `bg-slate-50/80 border-y border-slate-200/80`, `th` = `px-4 py-2.5 text-left text-xs font-medium text-slate-500 first:pl-6 md:first:pl-7 last:pr-6`.
  - `td`: `px-4 py-3.5 border-b border-slate-100 text-slate-600 first:pl-6 md:first:pl-7`. Kolom `primary` `font-medium text-slate-900`. Kolom angka `text-right tabular-nums`.
  - `tbody tr`: `transition-colors hover:bg-slate-50/60`. Baris terakhir tanpa border.
  - `actions`: kolom terakhir `w-px whitespace-nowrap text-right` berisi `IconButton`. Aksi `danger` otomatis memakai `useConfirm()`.
- **< `md`:** `<ul className="divide-y divide-slate-100">`. Tiap baris berupa kartu ringkas `px-5 py-4`: kolom `primary` (tebal) + badge di kanan, lalu `dl grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]` untuk kolom lain (kecuali `hideBelow`), dan aksi sebagai `IconButton` sejajar di bawah. Tidak ada scroll horizontal.
- **Paginasi** (footer `px-6 md:px-7 py-4 border-t border-slate-100 flex items-center justify-between gap-3`): teks "Menampilkan **1–10** dari **42**" (`from/to/total`) + tombol `ChevronLeft`/`ChevronRight` dari `links[0]` / `links.at(-1)`, plus nomor halaman (`hidden md:flex`, pill `h-8 min-w-8 rounded-lg`, aktif `bg-slate-900 text-white`). Label diambil dari angka, **tanpa** `dangerouslySetInnerHTML` (D-13). Navigasi `preserveScroll` + `preserveState`.

### 3.7 `FilterBar`
`<FilterBar onSubmit onReset activeCount>{FormInput/FormSelect…}</FilterBar>`
- ≥ `lg`: satu baris `flex flex-wrap items-end gap-3`, kontrol `w-full lg:w-48` (pencarian `lg:w-64`), tombol "Terapkan" (`secondary sm`) + "Reset" (`ghost sm`).
- < `lg`: tombol pemicu `secondary sm` "Filter" + jumlah filter aktif. Membuka panel `grid gap-3 sm:grid-cols-2` di bawahnya (disclosure, `aria-expanded`).
- Filter instan (select status) boleh langsung `router.get` tanpa tombol.
- Tidak lagi menjadi kartu tersendiri berjudul "Filter".

### 3.8 `FormInput`, `FormSelect`, `FormTextarea`
`<FormInput id label hint? error? required? prefix? suffix? …inputProps />`
- Label `mb-1.5 block text-[13px] font-medium text-slate-700` + tanda `*` `text-red-600` bila `required`.
- Kontrol: `h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-[0_1px_0_rgb(15_23_42/0.02)] transition focus:border-red-600 focus:outline-none focus:ring-4 focus:ring-red-600/10 disabled:bg-slate-50 disabled:text-slate-500`
- `error`: `border-red-600` + `aria-invalid` + `aria-describedby` ke `<p class="mt-1.5 text-[13px] text-red-600">`. `hint` memakai `text-xs text-slate-500`.
- `prefix="Rp"` / `suffix="%"`: addon di dalam kontrol (`pl-10`, teks `text-slate-500`). Input uang `inputMode="decimal"`.
- `FormSelect`: `appearance-none pr-10` + ikon `ChevronDown` absolut.
- `FormTextarea`: `min-h-28 py-2.5`.
- `FormCheckbox` kecil (`accent-red-600 h-4 w-4 rounded`) untuk "Ingat saya", `is_public`, `is_published`.
- Layout form: `grid gap-4 sm:grid-cols-2`, field panjang `sm:col-span-2`. Aksi form di footer kartu (`mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5`).

### 3.9 `FileDropzone`
`<FileDropzone id label accept=".jpg,.jpeg,.png,.webp" maxSizeMb={5} value onChange error hint existingUrl? />`
- Kotak `rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-6 text-center`. Ikon `UploadCloud h-5 w-5 text-slate-400`. Teks "**Pilih berkas** atau seret ke sini" (`text-sm`, "Pilih berkas" `font-medium text-slate-900 underline-offset-4`), hint `text-xs text-slate-500` "JPG, PNG, WEBP · maks 5 MB".
- `<input type="file" class="sr-only">` di dalam `<label>`, sehingga keyboard dan pembaca layar berfungsi. `dragover` → `border-red-600 bg-red-50/40`.
- Terisi: pratinjau thumbnail `h-16 w-16 rounded-lg object-cover` (gambar) atau chip `FileText` + nama + ukuran (PDF), lalu tombol `IconButton X` "Hapus berkas". `existingUrl` menampilkan berkas tersimpan.
- Pra-validasi di klien (ukuran & ekstensi) hanya untuk umpan balik cepat. Validasi server tetap otoritatif (*Hard Constraint* #6).
- Dipakai di: Laporan progres (3 dropzone tahap `grid sm:grid-cols-3`), bukti transaksi (`FormTransaksi`, `accept` + `.pdf`), sampul berita, dan foto bukti pengaduan.

### 3.10 `EmptyState`
`<EmptyState icon={Inbox} title description? action? />`
- `flex flex-col items-center px-6 py-10 text-center`. Ikon 20px `text-slate-400` dalam kotak `h-10 w-10 rounded-xl border border-slate-200 bg-white shadow-card`, **bukan** lingkaran pastel.
- `title`: `mt-4 text-sm font-medium text-slate-900`. `description`: `mt-1 max-w-sm text-sm text-slate-500`. `action` opsional berupa `Button size="sm"`.
- Kalimat netral: "Belum ada pengeluaran", "Proyek tidak ditemukan. Ubah filter pencarian."

### 3.11 `ProgressBar` (dirombak)
`h-1.5 rounded-full bg-slate-100`, isi `bg-slate-800`, kritis `bg-red-600`. Ukuran `lg` = `h-2.5`. Label persen selalu teks di luar bar (`text-xs tabular-nums text-slate-500`). Atribut ARIA dipertahankan.

### 3.12 `Modal` & `useConfirm`
- `<Modal open onClose title description size="sm|md|lg" footer>` memakai **`<dialog>` native** (`showModal()`): fokus terkunci, `Esc`, dan latar *inert* tanpa pustaka tambahan.
  - Panel `w-[min(100vw-2rem,28rem)] rounded-2xl border border-slate-200/80 bg-white p-6 shadow-pop` (`md` 36rem, `lg` 48rem), `backdrop:bg-slate-900/40 backdrop:backdrop-blur-[2px]`.
  - Judul `font-display text-base font-semibold text-slate-900`. Footer `mt-6 flex justify-end gap-2`. Di bawah `sm`, panel menempel bawah (`mt-auto mb-0 rounded-b-none`).
- `useConfirm()` → `confirm({ title, description, confirmLabel = 'Hapus', tone = 'danger' }) : Promise<boolean>`, dipasang sekali lewat `<ConfirmProvider>` di kedua layout.
- Menggantikan **semua** `window.confirm` (D-7) dan form "Tolak laporan" (textarea catatan di dalam modal).

### 3.13 Format angka (`Components/UI/format.js`, menggantikan isi `MoneyFormat.jsx`)
```js
formatRupiah(n, { ringkas = false } = {})
// biasa : "Rp 150.000.000"   (tanpa ",00"; sen tampil hanya bila ≠ 0)
// ringkas: "Rp 150 jt" | "Rp 1,2 M" | "Rp 850 rb"
formatPersen(n)            // "65,5%"  (maks 1 desimal, koma Indonesia)
formatTanggal(d)           // "21 Nov 2026"
formatTanggalWaktu(d)      // "21 Nov 2026, 10.20"
formatRelatif(d)           // "2 jam lalu" (Intl.RelativeTimeFormat 'id')
```
- `<Money value ringkas? />` membungkus dengan `tabular-nums` + `title` berisi nilai penuh.
- Ini murni format tampilan. Nilai `DECIMAL(15,2)` dari server tidak diubah, dan perhitungan tetap di backend.

### 3.14 `Callout`
`<Callout tone="info|success|critical" title>`: kartu putih `rounded-xl border border-slate-200/80 bg-white p-4`, garis kiri `border-l-2` (`slate-900` / `emerald-500` / `red-600`), dan ikon 16px. Menggantikan kartu `bg-emerald-50` (tiket pengaduan) dan `bg-red-50` (catatan penolakan) (D-9).

### 3.15 `Toast` (rombak `FlashToast`)
Posisi `top-4 right-4` (mobile `inset-x-4`), kartu putih `rounded-xl shadow-pop border`, ikon status 16px (`CheckCircle2` emerald, `AlertCircle` red, `Info` slate), teks `text-sm text-slate-700`, tombol tutup `IconButton`, hilang otomatis 5 detik, `role="status"` / `aria-live="polite"`.

### 3.16 `ChartFrame`
`<ChartFrame height="h-64 md:h-72" label="Ringkasan untuk pembaca layar">{<Bar …/>}</ChartFrame>`
→ `relative w-full min-w-0 {height}`, `role="img"`, `aria-label={label}`. Tinggi selalu tetap, jadi kanvas tidak meluber dan tidak "melompat" saat data dimuat.

---

## 4. Layout

### 4.1 `AuthenticatedLayout` (panel internal)
```
┌────────────┬───────────────────────────────────────────────────────┐
│ ▣ SIMBANGDES│ ☰  Pemdes / Keuangan           ↗ Portal publik   (KD)▾│ topbar h-14 bg-white/80 backdrop-blur border-b
│             ├───────────────────────────────────────────────────────┤
│ ▢ Dashboard │  PageHeader                                            │
│ ▢ Proyek    │  BentoGrid …                                           │
│ ▾ Keuangan  │                                                        │
│   │ Anggaran│                                                        │
│   │ Pengel… │                                                        │
│ ▢ Riwayat   │                                                        │
│ …           │                                                        │
│ ─────────── │                                                        │
│ (KD) Kepala │                                                        │
│ Desa · Kel. │                                                        │
└────────────┴───────────────────────────────────────────────────────┘
```
- **Sidebar putih** (D-1): `w-64 border-r border-slate-200/80 bg-white`.
  - Logo: kotak `h-7 w-7 rounded-lg bg-red-600` berisi "S" + teks `font-display font-semibold text-slate-900`.
  - Item: `relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900`, ikon `h-5 w-5 text-slate-400`.
  - Aktif: `bg-slate-100 text-slate-900`, ikon `text-slate-900`, + indikator `before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-red-600`.
  - Grup (`children`): anak berada di `ml-[22px] border-l border-slate-200 pl-3`. Anak aktif `text-slate-900 font-medium` + titik merah 6px. `ChevronDown` berputar. Struktur data `MENU` dan logika grup dari Sesi 9 **tetap**.
  - Kaki sidebar: kartu pengguna (avatar inisial `bg-slate-100 text-slate-700`, nama, peran) + `IconButton LogOut`.
- **Topbar:** tombol menu (mobile), *breadcrumb* sederhana (peran / grup menu aktif, diturunkan dari `MENU`), lalu di kanan tautan `ExternalLink` "Portal publik" dan menu avatar (Profil, Keluar) memakai popover `shadow-pop`.
- **Drawer mobile:** sidebar yang sama, overlay `bg-slate-900/40`, `Esc`/klik luar menutup, scroll body dikunci (perilaku lama dipertahankan).
- `<main className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">`.

### 4.2 `PublicLayout` (portal publik)
- Header `sticky top-0 z-30 h-16 border-b border-slate-200/80 bg-white/85 backdrop-blur`.
  - Navigasi `text-sm font-medium text-slate-600 hover:text-slate-900`. Aktif `text-slate-900` + garis bawah 2px `red-600` (`after:`).
  - Dropdown grup: panel `rounded-2xl border bg-white p-1.5 shadow-pop`, item berisi ikon 16px + judul + deskripsi 1 baris (`text-xs text-slate-500`).
- CTA kanan: **satu** `primary` "Buat pengaduan" + tautan `ghost` "Masuk" (sebelumnya "Login Internal" merah, D-1).
- Mobile: tombol `Menu` → *sheet* layar penuh putih berisi seksi bergrup, CTA di bawah. Struktur `MENU` lama dipertahankan.
- **Footer baru** (`border-t bg-white`): 3 kolom `md:grid-cols-3` (identitas desa + deskripsi singkat; tautan cepat; jam layanan & alamat kantor desa sebagai teks statis), baris hak cipta `text-xs text-slate-500`. Tanpa ikon media sosial palsu.
- Konten `max-w-[1280px] px-4 md:px-6 lg:px-8 py-8 lg:py-10`.

---

## 5. Chart.js Global (`resources/js/chartSetup.js`)

**Palet tunggal:** `merah #dc2626` (sorotan kritis), `gelap #1e293b` (slate-800, data utama), `muda #cbd5e1` (slate-300, pembanding). Untuk kategori ke-4 dan seterusnya: `#64748b` (slate-500) lalu `#e2e8f0` (slate-200). Kategori > 5 → ganti ke **bar horizontal satu warna** `gelap`, bukan doughnut.

```js
ChartJS.defaults.font.family = "'Inter', ui-sans-serif, system-ui, sans-serif";
ChartJS.defaults.font.size = 12;
ChartJS.defaults.color = '#64748b';
ChartJS.defaults.borderColor = '#f1f5f9';
ChartJS.defaults.maintainAspectRatio = false;
ChartJS.defaults.responsive = true;
ChartJS.defaults.layout.padding = 4;
ChartJS.defaults.animation.duration = 400;

ChartJS.defaults.plugins.legend.position = 'bottom';
ChartJS.defaults.plugins.legend.align = 'start';
Object.assign(ChartJS.defaults.plugins.legend.labels, { usePointStyle: true, pointStyle: 'circle', boxWidth: 6, boxHeight: 6, padding: 16 });

Object.assign(ChartJS.defaults.plugins.tooltip, {
    backgroundColor: '#0f172a', titleColor: '#fff', bodyColor: '#cbd5e1',
    titleFont: { weight: '600' }, padding: 10, cornerRadius: 8, boxPadding: 4,
    usePointStyle: true, displayColors: true, caretSize: 0,
});

// Tanpa grid vertikal, sumbu tanpa garis border, grid horizontal halus.
ChartJS.defaults.scales.category.grid = { display: false };
ChartJS.defaults.scales.category.border = { display: false };
ChartJS.defaults.scales.linear.grid = { color: '#f1f5f9', drawTicks: false };
ChartJS.defaults.scales.linear.border = { display: false };
ChartJS.defaults.scales.linear.ticks = { padding: 8, maxTicksLimit: 5 };

Object.assign(ChartJS.defaults.elements.bar, { borderRadius: 6, borderSkipped: false, maxBarThickness: 28 });
ChartJS.defaults.datasets.bar.categoryPercentage = 0.6;
ChartJS.defaults.datasets.bar.barPercentage = 0.85;
Object.assign(ChartJS.defaults.elements.line, { borderWidth: 2, tension: 0.35 });
Object.assign(ChartJS.defaults.elements.point, { radius: 0, hoverRadius: 4, hitRadius: 12 });
ChartJS.defaults.elements.arc.borderWidth = 0;
ChartJS.defaults.datasets.doughnut.cutout = '74%';

export const WARNA_CHART = { merah: '#dc2626', gelap: '#1e293b', muda: '#cbd5e1', tengah: '#64748b', pudar: '#e2e8f0' };
export const tickRupiah = (v) => formatRupiah(v, { ringkas: true });
```
- Kunci lama `slate`, `slateMuda`, `kuning`, `hijau`, `biru` dipetakan sementara (`kuning/hijau/biru` → `tengah/gelap/pudar`) dan dihapus di akhir Gelombang 3.

**Pemetaan warna per chart (wajib):**

| Chart | Pemetaan |
| :--- | :--- |
| Pagu vs Realisasi (Pemdes, Transparansi, Statistik) | Pagu `muda`, Realisasi `gelap`. Realisasi ≥ 100% pagu → batang itu `merah` (warna per-batang) |
| Rencana vs Realisasi per komponen | Rencana `muda`, Realisasi `gelap`. Realisasi > rencana → batang `merah` |
| Distribusi status proyek (doughnut) | Berjalan `gelap`, Selesai `muda`, Perencanaan `pudar`, **Terlambat `merah`**. Angka total di tengah (`font-display text-2xl font-semibold`) + label `text-xs text-slate-500` |
| Status laporan (Pelaksana) | Disetujui `gelap`, Menunggu `muda`, Ditolak `merah` |
| Progres fisik per proyek (Pelaksana) | Bar horizontal (`indexAxis: 'y'`): target `muda`, aktual `gelap`, aktual Terlambat `merah` |
| Login harian (Admin) | Line `gelap` tanpa fill, titik muncul saat hover |
| Komposisi role (Admin) | admin `gelap`, pemdes `tengah`, pelaksana `muda` |
| Status pengaduan (Statistik) | Selesai `gelap`, Diproses `tengah`, Menunggu `muda` |

- Legenda disembunyikan bila hanya ada 1 dataset. Doughnut memakai legenda kustom HTML di samping/bawah (daftar `dot + label + angka tabular`) agar sejajar dengan tipografi halaman.
- Setiap chart dibungkus `ChartFrame` (tinggi tetap `h-64 md:h-72`, doughnut `h-56`), dengan `aria-label` berisi ringkasan angka.

---

## 6. Leaflet Maps

### 6.1 Penempatan full-bleed
```jsx
<BentoCard span="hero" flush>
  <div className="relative isolate h-[360px] md:h-[480px] lg:h-[560px]">
    <PetaProyek … className="h-full w-full" />
    <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000] flex items-start justify-between gap-2">
      <div className="pointer-events-auto rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 shadow-card backdrop-blur"> legenda </div>
    </div>
  </div>
</BentoCard>
```
- Kartu `flush` memberi sudut `rounded-2xl` + `overflow-hidden`, sehingga peta mengikuti sudut kartu **tanpa** `!p-3` (D-12). Judul dan jumlah proyek dipindah ke `PageHeader` atau ke overlay legenda.
- Legenda: dua baris `dot + label` ("Berjalan / Selesai", "Terlambat") + jumlah proyek `tabular-nums`.

### 6.2 `PetaProyek.jsx`
- **Marker `L.divIcon`** (menggantikan ikon PNG + *hack* `_getIconUrl`):
  `className: 'peta-marker'`, `html: '<span></span>'`, `iconSize: [16, 16]`. Varian `peta-marker--kritis` untuk Terlambat dan `peta-marker--aktif` untuk `fokus`.
- `scrollWheelZoom={false}`. Diaktifkan setelah pengguna klik peta (`map.once('click', () => map.scrollWheelZoom.enable())`), dan dimatikan lagi pada `mouseout`, agar scroll halaman di mobile tidak terjebak.
- `zoomControl={false}` + `<ZoomControl position="bottomright" />`.
- Popup: nama proyek (`font-display font-semibold`), `StatusBadge`, `ProgressBar` + persen, dan tautan "Lihat detail" + `ArrowRight` (tanpa `→`).
- Logika `invalidateSize` + `ResizeObserver` + `fitBounds` **dipertahankan**.
- Tile: tetap OpenStreetMap standar dengan atribusi wajib.

### 6.3 CSS Leaflet di `app.css` (`@layer components`, bebas konflik Tailwind v4)
```css
.leaflet-container img, .leaflet-tile { max-width: none !important; max-height: none !important; }
.leaflet-container { z-index: 0; isolation: isolate; font-family: var(--font-sans); background: var(--color-slate-100); }
.leaflet-container a { color: inherit; }
.leaflet-control-zoom { border: 0 !important; box-shadow: var(--shadow-card) !important; border-radius: 0.75rem; overflow: hidden; }
.leaflet-control-zoom a { width: 2rem !important; height: 2rem !important; line-height: 2rem !important; color: var(--color-slate-700) !important; border-color: var(--color-slate-200) !important; }
.leaflet-control-attribution { font-size: 10px; background: rgb(255 255 255 / 0.8) !important; border-top-left-radius: 0.5rem; }
.leaflet-popup-content-wrapper { border-radius: 0.875rem; box-shadow: var(--shadow-pop); border: 1px solid var(--color-slate-200); }
.leaflet-popup-content { margin: 0.875rem 1rem; font-size: 0.875rem; line-height: 1.4; }
.leaflet-popup-tip { box-shadow: none; border: 1px solid var(--color-slate-200); }
.peta-marker span { display: block; width: 16px; height: 16px; border-radius: 9999px; background: var(--color-slate-900); border: 3px solid #fff; box-shadow: 0 1px 4px rgb(15 23 42 / 0.35); }
.peta-marker--kritis span { background: var(--color-red-600); }
.peta-marker--aktif span { transform: scale(1.25); box-shadow: 0 0 0 4px rgb(220 38 38 / 0.25); }
```
- `@layer base` `border-color` global (§1.5) tidak memengaruhi Leaflet, karena aturan Leaflet berada di layer `components` yang lebih tinggi dan memakai `!important` sendiri.
- Overlay React di atas peta memakai `z-[1000]` di dalam wrapper `isolate`, sehingga tidak menembus topbar (`z-20`/`z-30`).

---

## 7. Peta Eksekusi 3 Gelombang

Setiap gelombang ditutup dengan: `npm run build` sukses · `php artisan test --compact` tetap 86/86 · cek 375/768/1280px + snippet overflow §2.2 · `graphify update .` · catatan di `PROGRESS.md`.

### 7.1 Gelombang 1 — Fondasi

| # | File | Pekerjaan |
| :--- | :--- | :--- |
| 1 | `resources/views/app.blade.php` | Google Fonts Inter + Plus Jakarta Sans, kelas `<body>` (§1.2) |
| 2 | `vite.config.js` | Hapus blok `fonts: [bunny(...)]` (satu-satunya perubahan di luar `resources/`) |
| 3 | `resources/css/app.css` | Token `@theme`, `@layer base`, Leaflet (§1.5, §6.3). `--shadow-bento` dialiaskan |
| 4 | `resources/js/app.jsx` | `LucideProvider strokeWidth={1.75}` |
| 5 | `resources/js/chartSetup.js` | Default global + palet §5 (kunci lama dipetakan) |
| 6 | `Components/UI/` **baru** | `Button` (+`IconButton`), `PageHeader`, `BentoGrid`, `BentoCard`, `KpiCard`, `DataTable` (+`Pagination`), `FilterBar`, `FormInput`, `FormSelect`, `FormTextarea`, `FormCheckbox`, `FileDropzone`, `StatusBadge`, `EmptyState`, `Modal` (+`ConfirmProvider`/`useConfirm`), `Callout`, `ChartFrame`, `format.js`, `index.js` |
| 7 | Adaptor di `Components/` | `BentoCard`, `StatCard`, `Field`, `StatusBadge`, `EmptyState`, `Pagination`, `MoneyFormat`, `ProgressBar`, `FlashToast` → delegasi ke `UI/` (§3, strategi migrasi) |
| 8 | `Layouts/AuthenticatedLayout.jsx` | Sidebar putih, topbar + breadcrumb + menu avatar, `ConfirmProvider` (§4.1) |
| 9 | `Layouts/PublicLayout.jsx` | Header, CTA tunggal, sheet mobile, footer baru, `ConfirmProvider` (§4.2) |
| 10 | `Components/PetaProyek.jsx` | Marker `divIcon`, zoom kanan-bawah, scroll-wheel klik-untuk-aktif (§6.2) |

Hasil yang diharapkan: seluruh halaman sudah memakai tipografi, kartu, badge, tombol, dan chart baru lewat adaptor, sebelum satu halaman pun diedit.

### 7.2 Gelombang 2 — Portal Publik (`Pages/Public/`)

| Halaman | Komposisi Bento (lg) | Perbaikan utama |
| :--- | :--- | :--- |
| **Beranda** `Home.jsx` | `PageHeader` eyebrow "Portal transparansi desa" + CTA → `hero` 8 (ringkasan serapan: angka besar + `ProgressBar lg` + 3 angka kecil) / `highlight` 4 `inverse` (pengaduan: 2 tombol, tanpa ikon besar) → `kpi4`×4 → `chart` 7 (proyek terbaru, daftar 3 baris + progres) / `list` 5 (berita terbaru, 3 item) → `full` tautan jelajah (3 kolom: Peta, Statistik, Galeri; ikon 20px + judul + 1 kalimat) | D-1, D-2, D-10; hilangkan duplikasi kartu "Jelajahi" |
| **Katalog Proyek** `Proyek/Index.jsx` | `PageHeader` + jumlah → `FilterBar` (tahun, status, kategori, lokasi, cari) di kartu `full` tipis → grid kartu proyek `md:col-span-3 lg:col-span-4` (nama, lokasi, badge, progres, pagu ringkas) → paginasi | Kartu proyek seragam tinggi (`flex-col`, progres `mt-auto`) |
| **Detail Proyek** `Proyek/Show.jsx` | `PageHeader back` + badge → `hero` 8 (info + deskripsi) / `highlight` 4 (progres besar + target + jadwal) → `kpi3`×3 (pagu, realisasi, sisa) → `chart` 7 (galeri 3 tahap, Lightbox) / `list` 5 (riwayat laporan disetujui sebagai timeline) | Galeri `aspect-[4/3] rounded-xl`, tab tahap bila foto > 6 |
| **Peta** `Peta.jsx` | `PageHeader` → `hero` 8 `flush` peta + overlay legenda / `highlight` 4 daftar proyek (cari, `max-h-[560px] overflow-y-auto`, item aktif `bg-slate-100` + garis merah) | §6; mobile: peta dulu, lalu daftar |
| **Transparansi** `Transparansi.jsx` | `kpi3`×3 → `chart` 7 Pagu vs Realisasi / `list` 5 doughnut serapan + legenda kustom → `full` `DataTable` serapan per proyek (mobile → kartu) | §5 pemetaan; tabel tanpa `min-w` |
| **Statistik** `Statistik.jsx` | `hero` 8 (ringkasan naratif 2–3 angka utama) / `highlight` 4 `inverse` (pengaduan terselesaikan %) → `kpi4` maks. 3–4 → `chart` 7 tren serapan / `list` 5 status proyek → `chart` 7 proyek per kategori (bar horizontal) / `list` 5 status pengaduan | Hilangkan warna pelangi; kategori > 5 → bar horizontal |
| **Berita** `Berita/Index.jsx` | `PageHeader` + filter kategori (segmented control 2 opsi) → `hero` 8 berita utama (gambar `aspect-[16/9]`) / `list` 4 pengumuman terbaru (daftar teks bertanggal) → grid kartu `md:col-span-3 lg:col-span-4` → paginasi | Badge kategori Berita & Pengumuman memakai grup `Lainnya` (netral, tanpa merah) |
| **Detail Berita** `Berita/Show.jsx` | `PageHeader back` (judul, tanggal, kategori) → `hero` 8 artikel (`max-w-[68ch]`, `text-[15px] leading-7 whitespace-pre-line`, sampul + Lightbox) / `highlight` 4 info + berita lainnya | Tipografi artikel yang nyaman dibaca |
| **Galeri** `Galeri.jsx` | `PageHeader` + `FilterBar` (proyek, tahap) → `full` `flush` grid foto `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2` → paginasi | Caption muncul di bawah foto (bukan gradien gelap, D-9) |
| **Pengaduan** `Pengaduan/Create.jsx` | `PageHeader` → `hero` 8 form (field 2 kolom, `FileDropzone`, CAPTCHA) / `highlight` 4 `muted` (cara kerja 3 langkah bernomor, privasi, tautan cek tiket) | Sukses → `Callout success` berisi kode tiket + tombol salin (`Copy`) |
| **Cek Tiket** `Pengaduan/Cek.jsx` | `list` 5 form kode tiket (input besar `font-mono tracking-wider uppercase`) / `chart` 7 hasil: status badge + timeline 3 tahap (Menunggu → Diproses → Selesai) + tanggapan resmi | Status kosong → `EmptyState` |

### 7.3 Gelombang 3 — Login, Profil, Panel Internal

| Halaman | Komposisi Bento (lg) | Perbaikan utama |
| :--- | :--- | :--- |
| **Login** `Auth/Login.jsx` | Layar terbelah: panel kiri `hidden lg:flex` `bg-white border-r` (logo, nama sistem, 3 poin fitur dengan ikon 16px, tautan kembali `ArrowLeft`); kanan form terpusat `max-w-sm` di atas `slate-50` | Hapus kartu `dark`; satu tombol primary penuh lebar; `FormCheckbox` "Ingat saya" |
| **Profil** `Profile/Edit.jsx` | `PageHeader` → `hero` 8 data akun / `highlight` 4 ubah kata sandi | Form footer konsisten |
| **Dashboard Pemdes** | `kpi4`×4 (Total proyek · Terlambat `critical` · Serapan % · Laporan menunggu) → `chart` 7 Pagu vs Realisasi / `list` 5 status proyek → `chart` 7 Proyek berisiko (`DataTable` ringkas) / `list` 5 Laporan menunggu (daftar + tombol "Tinjau") | 7 KPI → 4 (pagu/realisasi/sisa pindah ke hint KPI Serapan & chart), sesuai §2.1 aturan 2 — memakai props yang sudah ada |
| **Proyek (Index/Form/Show)** | Index: `PageHeader` + aksi (Ekspor PDF `secondary`, Tambah proyek `primary`) → `DataTable` + `FilterBar`. Form: `hero` 8 data proyek / `highlight` 4 pelaksanaan + anggaran awal (sticky di `lg`). Show: komposisi Sesi 9 dipertahankan, kartu `dark` Aksi Cepat → `default` | `useConfirm` hapus; `inverse` dilarang di panel |
| **Keuangan (Anggaran, Pengeluaran, Rencana vs Realisasi) + `Anggaran/Show`** | Komposisi Sesi 9 dipertahankan. Pengeluaran: kartu "Filter" dilebur ke `FilterBar` toolbar tabel, form catat → `highlight` 4 sticky. `Anggaran/Show`: komponen RAB `DataTable` + form tambah di `Modal` (tombol "Tambah komponen") | `FormTransaksi` memakai `FileDropzone` + `prefix="Rp"`; selisih §5 |
| **Riwayat Proyek** | Tetap 4/8. Daftar proyek kiri: item `h-auto rounded-lg` gaya menu sidebar; timeline: titik 10px, garis `slate-200`, pemisah hari `sticky top-14` | `TimelineRiwayat` restyle saja |
| **Monitoring, Verifikasi Laporan, Pengaduan (Index/Show), Berita (Index/Form)** | Monitoring: `kpi3` (Aman/Waspada/Kritis dari data tabel di klien) + `DataTable`. Verifikasi: `DataTable` + panel detail di `Modal lg` (foto 3 tahap, Setujui `primary`, Tolak `secondary` → modal catatan). Pengaduan Show: `chart` 7 isi / `list` 5 tanggapan. Berita Form: `hero` 8 isi / `highlight` 4 sampul (`FileDropzone`) + publikasi | Hitungan KPI dari array props yang sudah dikirim, tanpa props baru |
| **Pelaksana (Dashboard, Proyek Index/Show, Laporan Index/Form)** | Dashboard: `kpi3` → `chart` 7 progres per proyek (bar horizontal) / `list` 5 status laporan → `full` perlu revisi (`Callout critical` per item). Laporan Form: `hero` 8 data progres (`suffix="%"`) / `highlight` 4 ringkasan proyek; dokumentasi `full` 3 `FileDropzone` tahap; catatan penolakan → `Callout critical` | Kartu `bg-red-50` dihapus |
| **Admin (Dashboard, Users Index/Form, Audit, Backup)** | Dashboard: `kpi3` → `chart` 7 login harian (line) / `list` 5 komposisi role → `full` 10 aktivitas terbaru (`DataTable` ringkas). Users: `DataTable` (badge role `Lainnya`, status aktif via badge) + toggle status `useConfirm`. Audit: `FilterBar` (jenis, rentang tanggal, cari) + `DataTable` read-only (tanpa kolom aksi). Backup: `highlight` 4 buat backup / `hero` 8 daftar berkas | Audit tetap tanpa tombol ubah/hapus (*Hard Constraint* #5) |

**Penutup Gelombang 3:** hapus adaptor lama (`BentoCard.jsx`, `StatCard.jsx`, `Field.jsx`, `MoneyFormat.jsx`, `Pagination.jsx`, `EmptyState.jsx`, `StatusBadge.jsx` di akar `Components/`), kunci warna chart lama, dan `--shadow-bento`. Tandai `UI-POLISH.md` sebagai digantikan oleh dokumen ini.

---

## 8. Definisi Selesai & Pemeriksaan Otomatis

Jalankan dari root proyek setelah Gelombang 3. Semua perintah harus mengembalikan **0 baris**:
```bash
grep -rnE "rounded-3xl|shadow-(md|lg|xl|2xl)|bg-gradient|shadow-bento" resources/js
grep -rnE "window\.confirm|[^.a-zA-Z]confirm\(" resources/js
grep -rn "dangerouslySetInnerHTML" resources/js
grep -rnE "bg-(blue|green|purple|violet|indigo|yellow|pink|sky|teal|cyan)-" resources/js
grep -rnE "→|←|&rarr;|&larr;" resources/js
grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" resources/js
grep -rnE "(^|[^:])col-span-(6|8|12)" resources/js/Pages                                # span tanpa prefiks
```
Tinjau manual sisa `grep -rn "text-slate-400" resources/js`: hanya boleh pada ikon dan `placeholder:`, tidak pada teks.

Checklist manual per halaman:
- [ ] Satu `PageHeader`, tanpa judul ganda; maks. 1 tombol `primary` per wilayah
- [ ] 375 / 768 / 1280px tanpa overflow (snippet §2.2); tabel menjadi kartu di < 768px
- [ ] Semua angka `tabular-nums`; rupiah tanpa `,00`; KPI rupiah ringkas
- [ ] Fokus keyboard terlihat; ikon tanpa teks punya `aria-label`; kontras teks ≥ 4.5:1 (tidak ada teks `slate-400`)
- [ ] Chart memakai palet §5, dibungkus `ChartFrame`, dengan `aria-label`
- [ ] `php artisan test --compact` 86/86 dan `npm run build` sukses (tidak ada perubahan PHP)
