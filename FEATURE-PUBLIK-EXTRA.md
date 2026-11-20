# FEATURE-PUBLIK-EXTRA — Statistik, Berita & Pengumuman, Galeri

> **Status:** cetak biru (belum ada kode aplikasi). Disusun 2026-11-21, setelah Fase 5 & UI Polish selesai (`PROGRESS.md`, `UI-POLISH.md`).
>
> **Cakupan:** 3 halaman publik baru (`/statistik`, `/berita` + `/berita/{slug}`, `/galeri`) dan CRUD Berita untuk role `pemdes` (`/pemdes/berita`).
>
> **Pakai yang sudah ada, jangan buat ulang:** `BentoGrid`/`BentoCard` (`variant="dark"`, `action`), `StatCard`, `EmptyState`, `Pagination`, `StatusBadge`, `Field`/`inputClass`/`fileClass`/`tombolMerah`/`tombolSekunder`, `formatTanggal` + `MoneyFormat`, `chartSetup.js` (`WARNA_CHART`, `potongLabel`), `ImageCompressionService::simpan()`, `AuditTrailObserver`, scope `Proyek::publik()`, dan `FlashToast`.

---

## 0. Keputusan yang Perlu Dikunci (K-3)

*Hard Constraint* #3 di `CLAUDE.md` melarang perubahan di luar `docs/DATABASE.md`. Tabel baru ini diminta langsung oleh pemilik proyek, jadi catat sebagai **K-3** di `PROGRESS.md §0` **sebelum** membuat migration:

| # | Keputusan | Alasan |
| :--- | :--- | :--- |
| K-3a | Tambah **tabel ke-9** `berita_pengumuman` (skema §1.1) | Permintaan baru dari pemilik proyek. Perbarui `docs/DATABASE.md` (bagian 4.9, ERD `users ||--o{ berita_pengumuman : "menulis"`, urutan migrasi #9) dan `docs/PRD.md` (*In-Scope*: Portal Publik ditambah Statistik, Berita, dan Galeri) |
| K-3b | `konten` adalah **teks polos** (dirender dengan `whitespace-pre-line`), **tanpa** editor *rich text* atau HTML | Tanpa dependensi baru dan tanpa risiko XSS (`dangerouslySetInnerHTML` dilarang) |
| K-3c | `slug` dibuat sekali saat *create* dan **tidak berubah** walaupun judul diedit | Tautan yang sudah dibagikan warga tidak putus |
| K-3d | Statistik pengaduan menghitung pengaduan yang `proyek_id`-nya `NULL` **atau** terhubung ke proyek publik. Pengaduan untuk proyek internal (`is_public = 0`) dikecualikan | Mengikuti BR-PUB tanpa membuang aduan umum. Yang dikirim hanya angka agregat, tanpa data pelapor (V-17) |
| K-3e | Tidak ada tabel atau kolom baru untuk Statistik dan Galeri | Keduanya murni query baca dari tabel yang sudah ada |

---

## 1. Berita & Pengumuman — Skema & Backend

### 1.1 Migration `2026_11_22_000001_create_berita_pengumuman_table.php`
Buat dengan `php artisan make:migration create_berita_pengumuman_table --no-interaction`.

| Kolom | Definisi Laravel | Catatan |
| :--- | :--- | :--- |
| `id` | `$table->id()` | |
| `user_id` | `foreignId('user_id')->constrained('users')->restrictOnDelete()` | Penulis. `RESTRICT` konsisten dengan V-12 (user tidak pernah dihapus) |
| `judul` | `string('judul', 200)` | |
| `slug` | `string('slug', 220)->unique()` | |
| `kategori` | `enum('kategori', ['Berita', 'Pengumuman'])->index()` | |
| `ringkasan` | `string('ringkasan', 300)` | Teks kartu & meta deskripsi |
| `konten` | `text('konten')` | Teks polos (K-3b) |
| `gambar_cover` | `string('gambar_cover', 255)->nullable()` | Path relatif disk `public`, selalu `.webp` |
| `is_published` | `boolean('is_published')->default(false)` | |
| `published_at` | `timestamp('published_at')->nullable()` | |
| — | `timestamps()` | |
| — | `index(['is_published', 'published_at'])` | Query publik selalu memfilter dan mengurutkan kedua kolom ini |

`down()`: `Schema::dropIfExists('berita_pengumuman')`.

### 1.2 Model `app/Models/BeritaPengumuman.php`
Ikuti pola atribut `#[Fillable]` seperti `Proyek.php`.

```php
#[Fillable(['judul', 'slug', 'kategori', 'ringkasan', 'konten', 'gambar_cover', 'is_published', 'published_at'])]
class BeritaPengumuman extends Model
{
    use HasFactory;

    protected $table = 'berita_pengumuman';

    protected function casts(): array
    {
        return ['is_published' => 'boolean', 'published_at' => 'datetime'];
    }

    public function penulis(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }

    /** Terbit = dipublikasikan dan waktunya sudah tiba (published_at di masa depan berarti terjadwal). */
    public function scopeTerbit(Builder $q): void
    {
        $q->where('is_published', true)->where('published_at', '<=', now());
    }

    public static function buatSlug(string $judul): string
    {
        $dasar = Str::limit(Str::slug($judul), 200, '') ?: 'berita';
        $slug = $dasar;
        for ($i = 2; static::where('slug', $slug)->exists(); $i++) {
            $slug = "{$dasar}-{$i}";
        }

        return $slug;
    }
}
```
- `user_id` **sengaja tidak** masuk `Fillable`. Isi lewat relasi `$request->user()->beritaPengumuman()->create($data)` sehingga FK terisi otomatis dan tidak bisa dipalsukan dari request.
- **`User.php`**: tambah relasi `beritaPengumuman()` → `hasMany(BeritaPengumuman::class, 'user_id')`.
- **Observer otomatis**: di `AppServiceProvider::boot()` tambahkan `BeritaPengumuman::class` ke array model yang di-`observe(AuditTrailObserver::class)`. Di `AuditTrailObserver::label()` tambahkan cabang `$model instanceof BeritaPengumuman => $model->judul`. Hasil log, misalnya: `Create BeritaPengumuman #3: Jadwal Musyawarah Desa 2027` (format V-13).
- **Factory** `database/factories/BeritaPengumumanFactory.php` (`php artisan make:factory`): `user_id => User::factory()->state(['role' => 'pemdes'])`, `judul => fake()->sentence(6)`, `slug` dari judul + `Str::random(4)`, `kategori => fake()->randomElement([...])`, `ringkasan`, `konten => fake()->paragraphs(4, true)`, `is_published => true`, `published_at => now()->subDay()`. Tambah state `draf()` (`is_published = false`, `published_at = null`).

### 1.3 Form Request `app/Http/Requests/Pemdes/BeritaRequest.php`
Cukup satu request untuk *store* dan *update* (pola `TransaksiRequest`), karena aturannya identik:

```php
return [
    'judul' => ['required', 'string', 'max:200'],
    'kategori' => ['required', Rule::in(['Berita', 'Pengumuman'])],
    'ringkasan' => ['required', 'string', 'max:300'],
    'konten' => ['required', 'string', 'max:20000'],
    'gambar_cover' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],  // Hard Constraint #6
    'is_published' => ['required', 'boolean'],
];
```
`slug`, `published_at`, dan `user_id` **tidak** diterima dari input; controller yang mengisinya.

### 1.4 Controller `app/Http/Controllers/Pemdes/BeritaController.php`
Konstruktor: `public function __construct(private ImageCompressionService $gambar) {}`.

| Method | Logika |
| :--- | :--- |
| `index(Request)` | `BeritaPengumuman::with('penulis:id,nama_lengkap')` + filter `kategori`, `status` (`terbit`/`draf`), dan `q` (`judul like`), lalu `->latest()->paginate(10)->withQueryString()` → `Pemdes/Berita/Index` |
| `create()` | → `Pemdes/Berita/Form` |
| `store(BeritaRequest)` | `$data = $request->safe()->except('gambar_cover')`; `slug = BeritaPengumuman::buatSlug($data['judul'])`; `published_at = $data['is_published'] ? now() : null`; jika ada file: `gambar_cover = $this->gambar->simpan($file, 'berita')`; lalu `$request->user()->beritaPengumuman()->create($data)` → redirect `pemdes.berita.index` + flash `success` |
| `edit(BeritaPengumuman $berita)` | → `Pemdes/Berita/Form` dengan `berita` |
| `update(BeritaRequest, BeritaPengumuman $berita)` | Isi data tanpa mengubah `slug` (K-3c). `published_at`: diisi `now()` **hanya** saat berubah draf → terbit dan masih `null`; terbit → draf mengosongkannya kembali ke `null`. Cover baru: simpan WebP baru, `save()`, **lalu** hapus berkas lama (urutan ini mencegah data hilang jika penyimpanan gagal) |
| `destroy(BeritaPengumuman $berita)` | Simpan path cover, `delete()`, lalu `Storage::disk('public')->delete($path)` (pola V-11) |

Bila perlu menjadwalkan terbit di masa depan, tambahkan input `published_at` nanti. Untuk sekarang di-*skip* karena tidak diminta.

### 1.5 Rute (`routes/web.php`, di dalam grup `role:pemdes`)
```php
// Unggah berkas lewat Inertia wajib POST (pola transaksi.update), jadi update tidak memakai PUT.
Route::resource('berita', BeritaController::class)->except(['show', 'update'])->parameters(['berita' => 'berita']);
Route::post('berita/{berita}', [BeritaController::class, 'update'])->name('berita.update');
```
`->parameters()` wajib dipasang karena *pluralizer* Inggris bisa men-*singular*-kan `berita` menjadi parameter yang tidak cocok dengan nama variabel `$berita`.

Menu sidebar Pemdes (`AuthenticatedLayout.jsx` → `MENU.pemdes`), disisipkan sebelum "Pengaduan":
`{ label: 'Berita & Pengumuman', route: 'pemdes.berita.index', match: ['pemdes.berita.*'], icon: Newspaper }`.

### 1.6 Seeder (`DatabaseSeeder`)
Tambah `$this->seedBerita($akun['pemdes'])` di `run()`. `WithoutModelEvents` tetap dipakai agar audit trail tidak terisi.

- **Gambar placeholder WebP:** perluas helper `buatFotoPlaceholder()` dengan parameter `string $folder = 'dokumentasi'`, dan ganti `imagejpeg` → `imagewebp($img, null, 80)` dengan ekstensi `.webp`. Dengan begitu foto dokumentasi seed juga konsisten WebP seperti hasil `ImageCompressionService`. Untuk cover pakai 1200×675 (16:9); tambah parameter ukuran bila perlu.
- **Data** (`published_at` relatif terhadap `now()`, `user_id` milik akun `pemdes`):

| # | Kategori | Judul | Ringkasan (inti) | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Berita | Pembangunan Jalan Usaha Tani Capai 65 Persen | Pengerasan 1,2 km jalan menuju persawahan Dusun I memasuki tahap pemadatan; ditargetkan rampung bulan depan | Terbit −3 hari |
| 2 | Pengumuman | Undangan Musyawarah Desa Penyusunan RKP Desa 2027 | Warga diundang ke Balai Desa untuk membahas usulan prioritas pembangunan tahun depan | Terbit −1 hari |
| 3 | Berita | Sumur Bor Air Bersih Resmi Dimanfaatkan Warga | Sumur bor kedalaman 80 m kini melayani ±120 KK; pengelolaan diserahkan kepada BUMDes | Terbit −20 hari |
| 4 | Pengumuman | Penutupan Sementara Jalan Dusun II untuk Pekerjaan Drainase | Akses jalan ditutup pukul 08.00–16.00 selama 7 hari; gunakan jalur alternatif lewat lapangan desa | Terbit −6 hari |
| 5 | Berita | Rencana Pembangunan Gapura Desa Dimulai Bulan Depan | Desain gapura telah disepakati; pekerjaan fisik dijadwalkan setelah pencairan Dana Desa tahap II | **Draf** (uji filter publik) |

`konten` berisi 3–4 paragraf realistis yang dipisahkan `\n\n`. Berita #1, #3, dan #5 diberi cover placeholder; #2 dan #4 tanpa cover (uji tampilan fallback).

---

## 2. Query & Logika Halaman Publik

Tambahkan di grup publik `routes/web.php`:
```php
Route::get('/statistik', StatistikController::class)->name('statistik');
Route::get('/berita', [BeritaPublikController::class, 'index'])->name('berita.index');
Route::get('/berita/{berita:slug}', [BeritaPublikController::class, 'show'])->name('berita.show');
Route::get('/galeri', GaleriController::class)->name('galeri');
```
Semua controller berada di `app/Http/Controllers/Publik/`.

> **Catatan `preventLazyLoading`:** setiap relasi yang dibaca saat serialisasi **wajib** ada di `with()`/`load()`. Saat memilih kolom di eager load, sertakan kolom kunci relasi (`id` di induk, FK seperti `proyek_id` di anak). Jika tidak, relasi terisi `null` tanpa error. Query agregat (`selectRaw … groupBy`) dan `whereHas` tidak memicu lazy loading.

### 2.1 `StatistikController` (`/statistik`)
Semua angka dihitung **di SQL** (DECIMAL eksak, sejalan dengan V-18). Tidak ada relasi yang diserialisasi, jadi tidak perlu `with()`.

```php
$proyekPublik = fn ($q) => $q->publik();

// a. KPI ringkas
$ringkasan = Proyek::publik()->selectRaw('COUNT(*) as jumlah_proyek, ROUND(AVG(progres_aktual), 2) as rata_progres')->first();
$uang = Anggaran::whereHas('proyek', $proyekPublik)
    ->selectRaw('COALESCE(SUM(pagu_anggaran),0) as pagu, COALESCE(SUM(total_realisasi),0) as realisasi')->first();

// b. Distribusi proyek per kategori (alias "label" agar tidak bentrok dengan nama kolom di GROUP BY)
$kategori = Proyek::publik()
    ->selectRaw("COALESCE(kategori, 'Lainnya') as label, COUNT(*) as jumlah")
    ->groupBy('kategori')->orderByDesc('jumlah')->get();

// c. Tren serapan anggaran per tahun anggaran
$tren = Anggaran::whereHas('proyek', $proyekPublik)
    ->selectRaw('tahun_anggaran, COUNT(*) as jumlah_proyek, SUM(pagu_anggaran) as pagu, SUM(total_realisasi) as realisasi,
                 ROUND(SUM(total_realisasi) / NULLIF(SUM(pagu_anggaran), 0) * 100, 2) as persen_serapan')
    ->groupBy('tahun_anggaran')->orderBy('tahun_anggaran')->get();

// d. Perbandingan status proyek (status yang kosong tetap tampil sebagai 0)
$status = collect(['Perencanaan', 'Berjalan', 'Terlambat', 'Selesai'])
    ->mapWithKeys(fn ($s) => [$s => 0])
    ->merge(Proyek::publik()->selectRaw('status_proyek, COUNT(*) as jumlah')->groupBy('status_proyek')->pluck('jumlah', 'status_proyek'));

// e. Tingkat penyelesaian pengaduan (K-3d)
$aduan = collect(['Menunggu', 'Diproses', 'Selesai', 'Ditolak'])
    ->mapWithKeys(fn ($s) => [$s => 0])
    ->merge(PengaduanMasyarakat::where(fn ($q) => $q->whereNull('proyek_id')->orWhereHas('proyek', $proyekPublik))
        ->selectRaw('status_pengaduan, COUNT(*) as jumlah')->groupBy('status_pengaduan')->pluck('jumlah', 'status_pengaduan'));
$totalAduan = $aduan->sum();
$tingkatSelesai = $totalAduan > 0 ? round($aduan['Selesai'] / $totalAduan * 100, 1) : 0;
```
**Props** → `Public/Statistik`: `ringkasan`, `uang`, `kategori`, `tren`, `status`, `pengaduan` (`{ rincian: $aduan, total, tingkat_selesai }`).
- `persen_serapan` bernilai `NULL` bila pagu tahun itu 0. Frontend menampilkannya sebagai `0`.
- Cache tidak diperlukan karena data skala desa (puluhan baris). *shortcut: tanpa cache; tambahkan `Cache::remember` 10 menit bila proyek > ribuan.*

### 2.2 `BeritaPublikController` (`/berita`, `/berita/{slug}`)
```php
public function index(Request $request): Response
{
    $filter = $request->validate([
        'kategori' => ['nullable', Rule::in(['Berita', 'Pengumuman'])],
        'q' => ['nullable', 'string', 'max:100'],
    ]);

    $kolom = ['id', 'judul', 'slug', 'kategori', 'ringkasan', 'gambar_cover', 'published_at'];

    return Inertia::render('Public/Berita/Index', [
        'berita' => BeritaPengumuman::terbit()
            ->when($filter['kategori'] ?? null, fn ($q, $v) => $q->where('kategori', $v))
            ->when($filter['q'] ?? null, fn ($q, $v) => $q->where('judul', 'like', "%{$v}%"))
            ->latest('published_at')->paginate(9, $kolom)->withQueryString(),
        'pengumumanTerbaru' => BeritaPengumuman::terbit()->where('kategori', 'Pengumuman')
            ->latest('published_at')->limit(5)->get(['id', 'judul', 'slug', 'published_at']),
        'filter' => $filter,
    ]);
}

public function show(BeritaPengumuman $berita): Response
{
    // Draf & terjadwal → 404 (jangan bocorkan keberadaannya)
    abort_unless($berita->is_published && $berita->published_at?->isPast(), 404);
    $berita->load('penulis:id,nama_lengkap');

    return Inertia::render('Public/Berita/Show', [
        'berita' => $berita->only('id', 'judul', 'slug', 'kategori', 'ringkasan', 'konten', 'gambar_cover', 'published_at')
            + ['penulis' => $berita->penulis->nama_lengkap],
        'lainnya' => BeritaPengumuman::terbit()->whereKeyNot($berita->id)
            ->latest('published_at')->limit(4)->get(['id', 'judul', 'slug', 'kategori', 'gambar_cover', 'published_at']),
    ]);
}
```
Tidak ada relasi yang dibaca di daftar, sehingga daftar aman dari N+1. `penulis` di-`load` secara eksplisit. Hanya `nama_lengkap` yang dikirim; `email` dan `username` tidak.

### 2.3 `GaleriController` (`/galeri`)
```php
public function __invoke(Request $request): Response
{
    $filter = $request->validate([
        'proyek' => ['nullable', 'integer'],
        'tahap' => ['nullable', Rule::in(['Sebelum', 'Saat', 'Sesudah'])],
        'tahun' => ['nullable', 'integer', 'between:2000,2100'],
    ]);

    $disetujui = fn ($q) => $q->where('status_verifikasi', 'Disetujui');   // BR-PUB 2
    $publik = fn ($q) => $q->publik();                                      // BR-PUB 1

    $foto = DokumentasiFoto::query()
        ->whereHas('laporan', $disetujui)
        ->whereHas('proyek', $publik)
        ->with(['proyek:id,nama_proyek', 'proyek.anggaran:id,proyek_id,tahun_anggaran'])
        ->when($filter['proyek'] ?? null, fn ($q, $v) => $q->where('proyek_id', $v))
        ->when($filter['tahap'] ?? null, fn ($q, $v) => $q->where('tahap', $v))
        ->when($filter['tahun'] ?? null, fn ($q, $v) => $q->whereHas('proyek.anggaran', fn ($a) => $a->where('tahun_anggaran', $v)))
        ->latest('created_at')
        ->paginate(24, ['id', 'proyek_id', 'tahap', 'file_path', 'created_at'])
        ->withQueryString()
        ->through(fn ($f) => [
            'id' => $f->id, 'tahap' => $f->tahap, 'file_path' => $f->file_path, 'created_at' => $f->created_at,
            'proyek' => ['id' => $f->proyek->id, 'nama' => $f->proyek->nama_proyek],
            'tahun' => $f->proyek->anggaran?->tahun_anggaran,
        ]);

    return Inertia::render('Public/Galeri', [
        'foto' => $foto,
        'filter' => $filter,
        'opsi' => [
            'proyek' => Proyek::publik()->whereHas('dokumentasiFoto', fn ($q) => $q->whereHas('laporan', $disetujui))
                ->orderBy('nama_proyek')->get(['id', 'nama_proyek']),
            'tahun' => Anggaran::whereHas('proyek', $publik)->distinct()->orderByDesc('tahun_anggaran')->pluck('tahun_anggaran'),
        ],
        'perTahap' => DokumentasiFoto::whereHas('laporan', $disetujui)->whereHas('proyek', $publik)
            ->selectRaw('tahap, COUNT(*) as jumlah')->groupBy('tahap')->pluck('jumlah', 'tahap'),
    ]);
}
```
- `->through()` memastikan hanya field aman yang keluar: `laporan_id`, `keterangan`, `kendala`, dan `catatan_revisi` **tidak** dikirim.
- Filter `proyek` yang menunjuk proyek internal tetap aman karena `whereHas('proyek', $publik)` selalu berlaku, sehingga hasilnya kosong.

---

## 3. Desain Bento Box Grid & Navbar Publik

Aturan dari `UI-POLISH.md §2` tetap berlaku: kelas `col-span` **selalu** berprefiks `md:`/`lg:`, merah hanya untuk aksi utama, status kritis, dan indikator aktif, setiap halaman punya minimal satu baris asimetris, dan tanggal ditampilkan dengan `formatTanggal`.

### 3.1 `/statistik` — `Pages/Public/Statistik.jsx`
```
1280px (12 kolom)
┌──────────────────────────────── 8 ───────────────────────────────┐┌──────────── 4 ─────────────┐
│ Hero putih: eyebrow merah "Statistik Pembangunan", judul,        ││ variant="dark"             │
│ catatan "Hanya proyek yang dipublikasikan"                       ││ Pengaduan Terselesaikan    │
└──────────────────────────────────────────────────────────────────┘│ 72,5%  (text-5xl)          │
                                                                     │ 29 dari 40 aduan · tautan  │
                                                                     │ "Sampaikan Pengaduan →"    │
                                                                     └────────────────────────────┘
┌──── 3 ────┐┌──── 3 ────┐┌──── 3 ────┐┌──── 3 ────┐   StatCard: Proyek Publik · Total Pagu ·
└───────────┘└───────────┘└───────────┘└───────────┘   Serapan Total (%) · Rata-rata Progres Fisik
┌──────────────── 7 ────────────────┐┌──────────── 5 ────────────┐
│ Tren Serapan per Tahun Anggaran   ││ Status Proyek (Doughnut,   │
│ Bar Pagu (slate-300) + Realisasi  ││ total di tengah, cutout    │
│ (red-600) + Line % serapan (sumbu ││ 70%, legend bawah)         │
│ kanan, slate-800)                 ││                            │
└───────────────────────────────────┘└────────────────────────────┘
┌──────────────── 7 ────────────────┐┌──────────── 5 ────────────┐
│ Proyek per Kategori (bar          ││ Rincian Status Pengaduan:  │
│ horizontal, potongLabel)          ││ 4 baris label + angka +    │
│                                   ││ ProgressBar mini           │
└───────────────────────────────────┘└────────────────────────────┘
```
- Kelas: hero `md:col-span-6 lg:col-span-8`, kartu gelap `md:col-span-6 lg:col-span-4`, KPI `md:col-span-3 lg:col-span-3`, chart `md:col-span-6 lg:col-span-7`, samping `md:col-span-6 lg:col-span-5`.
- 768px: KPI 2×2, chart dan samping lebar penuh. 375px: satu kolom; wrapper chart `relative h-72 w-full`.
- Chart memakai `chartSetup.js`. Daftarkan `LineController`/`LineElement`/`PointElement` di sana jika belum ada, **bukan** `ChartJS.register` lokal (aturan UI-POLISH). Bila `tren` hanya 1 tahun, chart tetap bar biasa dengan subtitle "Data 1 tahun anggaran".
- Bila tidak ada proyek publik, setiap kartu chart menampilkan `EmptyState`.

### 3.2 `/berita` — `Pages/Public/Berita/Index.jsx`
```
┌──────────────────────────────────── 12 ────────────────────────────────────┐
│ Judul "Berita & Pengumuman" · segmen [Semua|Berita|Pengumuman] · input cari │
└────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────── 8 ─────────────────────────┐┌────────── 4 ──────────┐
│ SOROTAN (item pertama, hanya di halaman 1):        ││ Pengumuman Terbaru    │
│ cover aspect-[16/9] rounded-2xl, chip kategori,    ││ (daftar 5 judul +     │
│ judul text-2xl, ringkasan, tanggal, "Baca →"       ││ tanggal, ikon         │
└────────────────────────────────────────────────────┘│ Megaphone)            │
                                                      └───────────────────────┘
┌──── 4 ────┐┌──── 4 ────┐┌──── 4 ────┐   kartu berita: md:col-span-3 lg:col-span-4
│ cover 4/3 ││           ││           │   (2 kolom di 768px, 1 kolom di 375px)
│ chip·judul││           ││           │
└───────────┘└───────────┘└───────────┘
┌──────────────────────────────────── 12 ────────────────────────────────────┐
│ Pagination                                                                  │
└────────────────────────────────────────────────────────────────────────────┘
```
- Segmen kategori dan pencarian memakai `router.get(route('berita.index'), filter, { preserveState: true, replace: true })`, mengikuti pola filter di Katalog.
- Chip kategori: `Pengumuman` → `bg-red-50 text-red-700` (informasi yang butuh perhatian warga), `Berita` → `bg-slate-100 text-slate-700`.
- Tanpa cover: blok `aspect-[4/3] bg-slate-100` dengan ikon `Newspaper` `text-slate-300` di tengah, sehingga tinggi kartu tetap seragam.
- Saat filter aktif atau di halaman 2 ke atas, sorotan disembunyikan dan semua item tampil sebagai kartu biasa. Hasil kosong menampilkan `EmptyState`.

### 3.3 `/berita/{slug}` — `Pages/Public/Berita/Show.jsx`
```
┌──────────────────────── 8 ─────────────────────────┐┌────────── 4 ──────────┐
│ Breadcrumb: Berita & Pengumuman / Detail           ││ Info: kategori,       │
│ chip kategori · judul text-3xl font-bold           ││ tanggal terbit,       │
│ penulis · formatTanggal(published_at)              ││ penulis, tombol       │
│ cover aspect-[16/9] (klik → Lightbox)              ││ "Salin tautan"        │
│ konten: whitespace-pre-line, max-w-prose,          ││ (navigator.clipboard) │
│ text-slate-700 leading-relaxed                     │├───────────────────────┤
│                                                    ││ Berita Lainnya (4):   │
│                                                    ││ thumb 64px + judul    │
└────────────────────────────────────────────────────┘└───────────────────────┘
```
- Kelas: artikel `md:col-span-6 lg:col-span-8`, samping `md:col-span-6 lg:col-span-4`. Di 768px dan 375px samping turun ke bawah artikel.
- `<Head>`: `title = berita.judul` dan `<meta name="description" content={berita.ringkasan} />`.

### 3.4 `/galeri` — `Pages/Public/Galeri.jsx`
```
┌──────────────────────── 8 ─────────────────────────┐┌────────── 4 ──────────┐
│ Judul "Galeri & Dokumentasi" + keterangan "foto    ││ Jumlah foto per tahap │
│ dari laporan yang disetujui"                       ││ Sebelum · Saat ·      │
│                                                    ││ Sesudah (3 angka)     │
└────────────────────────────────────────────────────┘└───────────────────────┘
┌──────────────────────────────────── 12 ────────────────────────────────────┐
│ Filter: [Proyek ▾] [Tahap: segmen Semua|Sebelum|Saat|Sesudah] [Tahun ▾]     │
│ · "Reset" (tombolSekunder) · "24 foto"                                      │
└────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────── 12 ────────────────────────────────────┐
│ grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3                       │
│ ┌───────────┐┌─────┐┌─────┐   tile pertama: col-span-2 row-span-2          │
│ │  besar    │├─────┤├─────┤   tile: <button> aspect-square object-cover    │
│ └───────────┘└─────┘└─────┘   rounded-2xl; overlay bawah gradasi slate-900 │
│                               berisi chip tahap + nama proyek (truncate)   │
└────────────────────────────────────────────────────────────────────────────┘
Pagination (12)
```
- Di 375px filter menumpuk satu kolom dan segmen tahap bisa digeser (`overflow-x-auto`). Tile pertama tetap 2×2 di grid 2 kolom.
- `<img loading="lazy" alt="Foto tahap {tahap} — {nama proyek}">`.

### 3.5 Komponen baru `Components/Lightbox.jsx` (dipakai Galeri, Detail Proyek, dan cover Berita)
Pola modal di `Public/Proyek/Show.jsx` dipindah ke sini sekaligus diperbaiki, lalu `Show.jsx` memakainya (menghapus duplikasi).
- Props: `items` (array `{ src, alt, caption }`), `index` (angka atau `null`), `onClose`, `onIndexChange`.
- Markup: `fixed inset-0 z-50 bg-slate-900/90` dengan `role="dialog" aria-modal="true"`. Gambar `max-h-[80vh] rounded-2xl object-contain`. Caption di bawah gambar: nama proyek · tahap · `formatTanggal` (`text-sm text-slate-300`). Penghitung "3 / 24".
- Tombol: Tutup (`X`, kanan atas, menerima fokus saat terbuka), Sebelumnya/Berikutnya (`ChevronLeft/Right`, disembunyikan bila hanya 1 item). Semua tombol minimal 44×44px untuk sentuhan.
- Keyboard: `Esc` menutup, `←`/`→` berpindah foto. Saat terbuka scroll body dikunci (`document.body.style.overflow = 'hidden'`, dipulihkan di *cleanup*). Klik latar menutup, klik gambar tidak (`stopPropagation`).
- Navigasi hanya mencakup foto di halaman pagination yang sedang tampil. *shortcut: lightbox tidak memuat halaman berikutnya; tambahkan bila galeri sering > 24 foto per filter.*

### 3.6 Penataan Ulang `PublicLayout` (navbar)
Masalah: 5 menu ditambah 3 menu baru menjadi 8 tautan plus tombol login. Di 1024–1280px itu tidak muat dalam satu baris.

**Solusi: kelompokkan menjadi 5 entri tingkat atas, 2 di antaranya dropdown.**

```js
const MENU = [
    { label: 'Beranda', rute: 'beranda' },
    { label: 'Proyek', anak: [
        { label: 'Katalog Proyek', rute: 'proyek.publik', aktif: 'proyek.publik*', ikon: FolderKanban },
        { label: 'Peta Pembangunan', rute: 'peta', ikon: Map },
        { label: 'Galeri & Dokumentasi', rute: 'galeri', ikon: Images },
    ]},
    { label: 'Transparansi', anak: [
        { label: 'Transparansi Anggaran', rute: 'transparansi', ikon: Wallet },
        { label: 'Statistik Pembangunan', rute: 'statistik', ikon: BarChart3 },
    ]},
    { label: 'Berita & Pengumuman', rute: 'berita.index', aktif: 'berita.*' },
    { label: 'Pengaduan', rute: 'pengaduan.create', aktif: 'pengaduan.*' },
];
```

| Lebar | Perilaku |
| :--- | :--- |
| **≥ 1024px (`lg`), termasuk 1280px** | Baris horizontal 5 entri + tombol "Login Internal". Entri ber-`anak` berupa `<button aria-expanded aria-haspopup="true">` dengan label + `ChevronDown` (berputar 180° saat terbuka). Panel dropdown `absolute top-full mt-2 w-64 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-bento z-30`; setiap item berisi ikon `h-4 w-4 text-slate-400` + label, `rounded-xl px-3 py-2 hover:bg-slate-50`. Induk dianggap **aktif** (garis bawah merah) bila salah satu anaknya aktif. Item anak yang aktif: `bg-slate-50 text-slate-900` + `aria-current="page"` |
| **768px dan 375px (< `lg`)** | Tombol hamburger yang sudah ada → panel seluler. Grup **tidak** dijadikan dropdown bersarang; ditampilkan sebagai **seksi berjudul** (`text-xs font-semibold uppercase tracking-wider text-slate-400`, misalnya "PROYEK", "TRANSPARANSI") dengan anak-anaknya di bawahnya. Di 768px tautan seksi disusun `sm:grid sm:grid-cols-2` agar panel tidak terlalu tinggi. Panel diberi `max-h-[calc(100vh-4rem)] overflow-y-auto`; tombol Login di bagian bawah untuk < `sm` (pola yang sudah ada) |

Perilaku dropdown desktop (aksesibilitas):
- Satu state `bukaGrup` (label grup atau `null`), sehingga hanya satu dropdown yang terbuka.
- Tutup saat `Esc` (fokus kembali ke tombol induk), saat klik di luar (`mousedown` di `document` + `ref`), dan saat navigasi Inertia (`router.on('navigate', …)`, juga menutup panel seluler).
- Buka dengan klik/Enter/Space, **bukan** hover saja, agar berfungsi di layar sentuh dan keyboard.
- Footer kolom "Portal" me-*render* `MENU` yang sudah diratakan (`MENU.flatMap((m) => m.anak ?? [m])`), sehingga 8 tautan tampil tanpa dropdown. Di `md` kolom ini memakai `grid grid-cols-2 gap-x-6`.
- Fungsi `aktif(m)` diperluas: `m.anak ? m.anak.some(aktif) : route().current(m.aktif ?? m.rute)`.

Opsional, tidak dikerjakan kecuali diminta: kartu "Berita Terbaru" di Beranda.

---

## 4. Panel Pemdes — `Pages/Pemdes/Berita/`

| Halaman | Tata letak |
| :--- | :--- |
| `Index.jsx` | `BentoCard` `lg:col-span-12` dengan `action` = tombol merah "Tulis Berita" (`Plus`). Toolbar filter: segmen kategori, select status (Semua/Terbit/Draf), input cari. Tabel dalam `overflow-x-auto`: Judul (+ ringkasan `line-clamp-1`), Kategori (chip), Status (pill `emerald` Terbit / `slate` Draf), Tanggal terbit, Aksi (tombol teks "Lihat" ke `berita.show` di tab baru bila terbit, "Edit", dan "Hapus" dengan `confirm()`). Di < `md` tabel beralih ke daftar kartu (pola UI-POLISH Tahap C). `Pagination` |
| `Form.jsx` | Baris 8/4. **Kiri (8):** `Field` Judul, segmen Kategori, `textarea` Ringkasan dengan penghitung `x/300`, `textarea` Konten `rows={14}` dengan petunjuk "Pisahkan paragraf dengan baris kosong". **Kanan (4):** kartu "Gambar Sampul" (pratinjau `aspect-[16/9] rounded-2xl`, dari `URL.createObjectURL` atau `/storage/{gambar_cover}`, input `fileClass` dengan `accept="image/jpeg,image/png,image/webp"`, petunjuk "Maks 5 MB, otomatis dikonversi ke WebP") dan kartu "Publikasi" (checkbox `accent-red-600` "Terbitkan sekarang", info slug saat edit). Tombol "Simpan" merah + "Batal" sekunder di footer kartu kiri (`border-t pt-4`). Kirim dengan `useForm` + `post(route(edit ? 'pemdes.berita.update' : 'pemdes.berita.store', …), { forceFormData: true })` |

---

## 5. Pengujian (PHPUnit)

`php artisan make:test --phpunit BeritaTest`, dan tambahkan test di `PublikTest.php`. Semua memakai `RefreshDatabase` + `Storage::fake('public')`.

**`BeritaTest`**
- [ ] Pemdes membuat berita dengan cover JPG → berkas tersimpan di `berita/*.webp`, `slug` terisi, `user_id` = pemdes, dan `log_aktivitas` berisi `Create BeritaPengumuman #…`
- [ ] Judul sama dua kali → slug `…` dan `…-2`
- [ ] Update judul tidak mengubah slug; mengganti cover menghapus berkas lama
- [ ] Draf → terbit mengisi `published_at`; terbit → draf mengosongkannya
- [ ] Hapus berita menghapus berkas cover
- [ ] Cover > 5 MB atau MIME `gif` ditolak (`assertSessionHasErrors('gambar_cover')`)
- [ ] `pelaksana`, `admin`, dan guest tidak bisa mengakses `/pemdes/berita` (403 / redirect login)

**`PublikTest` (tambahan)**
- [ ] Loop rute publik ditambah `statistik`, `berita.index`, dan `galeri` → 200
- [ ] `/berita` tidak menampilkan draf; `/berita/{slug-draf}` → 404; slug terbit → 200 dengan prop `berita.penulis`
- [ ] `/statistik` tidak menghitung proyek `is_public = 0` (`status`, `kategori`, `uang.pagu`) maupun pengaduan dari proyek internal
- [ ] `/galeri` hanya memuat foto dari laporan `Disetujui` + proyek publik; filter `tahap=Sesudah` dan `tahun` bekerja; `tahap=xyz` → error validasi
- [ ] Respons galeri tidak mengandung `laporan_id`/`keterangan` (`->missing('foto.data.0.laporan_id')`)

---

## 6. Daftar File

| Status | File |
| :--- | :--- |
| Baru | `database/migrations/2026_11_22_000001_create_berita_pengumuman_table.php` |
| Baru | `app/Models/BeritaPengumuman.php`, `database/factories/BeritaPengumumanFactory.php` |
| Baru | `app/Http/Requests/Pemdes/BeritaRequest.php` |
| Baru | `app/Http/Controllers/Pemdes/BeritaController.php` |
| Baru | `app/Http/Controllers/Publik/StatistikController.php`, `BeritaPublikController.php`, `GaleriController.php` |
| Baru | `resources/js/Pages/Public/Statistik.jsx`, `Public/Berita/Index.jsx`, `Public/Berita/Show.jsx`, `Public/Galeri.jsx` |
| Baru | `resources/js/Pages/Pemdes/Berita/Index.jsx`, `Pemdes/Berita/Form.jsx` |
| Baru | `resources/js/Components/Lightbox.jsx` |
| Baru | `tests/Feature/BeritaTest.php` |
| Ubah | `app/Models/User.php` (relasi `beritaPengumuman()`) |
| Ubah | `app/Providers/AppServiceProvider.php` (observe `BeritaPengumuman`) |
| Ubah | `app/Observers/AuditTrailObserver.php` (label `judul`) |
| Ubah | `routes/web.php` (4 rute publik + resource pemdes) |
| Ubah | `database/seeders/DatabaseSeeder.php` (`seedBerita`, placeholder WebP) |
| Ubah | `resources/js/Layouts/PublicLayout.jsx` (menu bergrup + dropdown) |
| Ubah | `resources/js/Layouts/AuthenticatedLayout.jsx` (menu Pemdes) |
| Ubah | `resources/js/Pages/Public/Proyek/Show.jsx` (pakai `Lightbox`) |
| Ubah | `resources/js/chartSetup.js` (registrasi elemen Line bila belum ada) |
| Ubah | `tests/Feature/PublikTest.php` |
| Ubah | `docs/DATABASE.md`, `docs/PRD.md`, `PROGRESS.md` (K-3 + log sesi) |

## 7. Urutan Kerja & Definisi Selesai

1. Kunci K-3 di `PROGRESS.md`, lalu perbarui `docs/DATABASE.md` dan `docs/PRD.md`.
2. Backend Berita: migration → model + factory → observer → request → controller → rute → `BeritaTest` hijau.
3. Seeder → `php artisan migrate:fresh --seed` sukses; cek `storage/app/public/berita/*.webp`.
4. Controller publik (Statistik, Berita, Galeri) + test di `PublikTest`.
5. Frontend: `Lightbox` → `PublicLayout` → 4 halaman publik → 2 halaman Pemdes.
6. Selesai bila: `vendor/bin/pint --dirty --format agent`, `php artisan test` hijau, `npm run build` sukses, tidak ada scroll horizontal di 375px, dropdown navbar bisa dipakai lewat keyboard di 1280px, panel seluler rapi di 768px, lalu `PROGRESS.md` diperbarui dan `graphify update .` dijalankan.
