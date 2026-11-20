# FEATURE-PEMDES-EXTRA — Keuangan (Anggaran, Pengeluaran, Rencana vs Realisasi), Detail Proyek, Riwayat Proyek

> **Status:** cetak biru, belum ada kode aplikasi. Disusun 2026-11-21 (Sesi 9), setelah Fase 1–5, UI Polish, dan Fitur Publik Ekstra selesai (`PROGRESS.md`: 74 test hijau).
>
> **Cakupan:** 3 fitur untuk role `pemdes`: sub-menu **Keuangan** (`Anggaran`, `Pengeluaran`, `Rencana vs Realisasi`), halaman **Detail Proyek** `/pemdes/proyek/{proyek}`, dan **Riwayat Proyek** `/pemdes/riwayat-proyek` (komponen timeline juga dipakai di Detail Proyek).
>
> **Pakai yang sudah ada, jangan buat ulang:** `BentoGrid`/`BentoCard` (`variant="dark"`, `action`), `StatCard`, `ProgressBar`, `StatusBadge`, `EmptyState`, `Pagination`, `Lightbox`, `Field`/`inputClass`/`fileClass`/`tombolMerah`/`tombolAbu`, `MoneyFormat`/`formatRupiah`/`formatTanggal`, `chartSetup.js` (`WARNA_CHART`, `potongLabel`), `KalkulasiAnggaranService`, `AuditTrailObserver`, `LogAktivitas::catat()`, dan route `pemdes.anggaran.*` / `pemdes.transaksi.*` yang sudah berjalan.

---

## 0. Keputusan yang Perlu Dikunci (K-4)

*Hard Constraint* #3 melarang kolom di luar `docs/DATABASE.md`, dan **K-1 secara eksplisit men-*skip* `transaksi_pengeluaran.kategori_belanja`**. Permintaan ini membalik keputusan tersebut, jadi catat sebagai **K-4** di `PROGRESS.md §0` **sebelum** membuat migration, lalu perbarui `docs/DATABASE.md` (§4.10, ERD, urutan migrasi) dan `docs/PRD.md` (FR-03: kategori belanja masuk *In-Scope*).

| # | Keputusan | Alasan |
| :--- | :--- | :--- |
| K-4a | Tambah **tabel ke-10** `rab_komponen` (rincian rencana anggaran per komponen), FK ke **`anggaran_id`**, bukan `proyek_id` | `anggaran` adalah 1:1 dengan `proyek`, dan `transaksi_pengeluaran` sudah menunjuk `anggaran_id`. Validasi "komponen milik anggaran yang sama" cukup `where('anggaran_id', $transaksi->anggaran_id)` tanpa memuat relasi tambahan |
| K-4b | Tambah `transaksi_pengeluaran.rab_komponen_id` (**nullable**). Kolom teks `jenis_pengeluaran` **tidak** dibuat | Jenis pengeluaran = nama komponen lewat FK, jadi tidak ada data ganda yang bisa saling bertentangan. Transaksi lama atau transaksi dari test Fase 1–5 tetap valid dan tampil sebagai **"Tanpa Komponen"** |
| K-4c | Tambah `log_aktivitas.proyek_id` (**nullable, ber-index, TANPA FK constraint**) | `cascadeOnDelete` akan menghapus audit trail, dan `nullOnDelete` akan **mengubah** baris audit di level DB tanpa melewati hook model. Keduanya melanggar BR-SYS 6.1 (*append-only*). Tanpa constraint, log "Delete Proyek #5" tetap tertaut ke id proyeknya |
| K-4d | Format `aktivitas` tetap `"{Aksi} {Entitas} #{id}: {label}"`. Hanya **label** yang diperkaya (perubahan pelaksana, status, pagu, hasil verifikasi) | Filter Audit Trail (`like 'Create%'`) dan assertion test (`AuthTest:154`, `PublikExtraTest:168`) bergantung pada prefiks ini |
| K-4e | Total `nominal_rencana` per anggaran **≤ `pagu_anggaran`**. Realisasi per komponen **boleh** melebihi rencananya (ditandai merah). Batas keras tetap total realisasi ≤ pagu (BR-FIN 1.1) | Sesuai contoh pemilik proyek (Material: rencana 40 jt, realisasi 45 jt). Pergeseran antar-komponen lumrah di lapangan |
| K-4f | Pagu **tidak boleh** diturunkan di bawah total rencana komponen (perluasan V-09) | Menjaga invarian K-4e |

---

## 1. Penyesuaian Database (Backward-Compatible)

Semua migration hanya **menambah** tabel atau kolom nullable, sehingga data dan test lama tidak berubah perilakunya.

### 1.1 Migration `2026_11_22_000001_create_rab_komponen_table.php`
`php artisan make:migration create_rab_komponen_table --no-interaction`

| Kolom | Definisi Laravel | Catatan |
| :--- | :--- | :--- |
| `id` | `$table->id()` | |
| `anggaran_id` | `foreignId('anggaran_id')->constrained('anggaran')->cascadeOnDelete()` | Ikut terhapus saat proyek dihapus (rantai `proyek → anggaran`) |
| `nama_komponen` | `string('nama_komponen', 100)` | Contoh: Material, Tenaga Kerja, Transportasi, Peralatan, Lain-lain |
| `nominal_rencana` | `decimal('nominal_rencana', 15, 2)` | *Hard Constraint* #4 |
| — | `timestamps()` | |
| — | `unique(['anggaran_id', 'nama_komponen'])` | Satu nama komponen per anggaran, sehingga agregasi tidak ganda |

`down()`: `Schema::dropIfExists('rab_komponen')`.

### 1.2 Migration `2026_11_22_000002_add_rab_komponen_id_to_transaksi_pengeluaran_table.php`
```php
Schema::table('transaksi_pengeluaran', function (Blueprint $table) {
    $table->foreignId('rab_komponen_id')->nullable()->after('anggaran_id')
        ->constrained('rab_komponen')->nullOnDelete();
});
// down(): $table->dropConstrainedForeignId('rab_komponen_id');
```
- `nullOnDelete`, **bukan** `restrictOnDelete`. Saat proyek dihapus, MySQL meng-*cascade* `anggaran` ke `rab_komponen` **dan** `transaksi_pengeluaran` tanpa urutan yang dijamin, sehingga `RESTRICT` bisa menggagalkan `ProyekController@destroy`.
- Larangan menghapus komponen yang sudah punya transaksi ditegakkan di controller (§2.4), bukan di FK.

### 1.3 Migration `2026_11_22_000003_add_proyek_id_to_log_aktivitas_table.php`
```php
Schema::table('log_aktivitas', function (Blueprint $table) {
    $table->unsignedBigInteger('proyek_id')->nullable()->after('user_id');
    $table->index(['proyek_id', 'id']); // query timeline: where proyek_id = ? order by id desc
});
// down(): dropIndex(['proyek_id', 'id']) lalu dropColumn('proyek_id')
```
Tanpa `->constrained()`, lihat K-4c. `ALTER TABLE ... ADD COLUMN` tidak memicu hook `updating` model, jadi aman bagi baris lama.

### 1.4 Model
| File | Perubahan |
| :--- | :--- |
| `app/Models/RabKomponen.php` (**baru**, `php artisan make:model RabKomponen --factory`) | `#[Fillable(['anggaran_id', 'nama_komponen', 'nominal_rencana'])]`, `$table = 'rab_komponen'`, cast `nominal_rencana => 'decimal:2'`, relasi `anggaran(): BelongsTo` dan `transaksi(): HasMany` |
| `Anggaran.php` | + `komponen(): HasMany` → `RabKomponen::class` |
| `TransaksiPengeluaran.php` | + `rab_komponen_id` di `#[Fillable]`, + `komponen(): BelongsTo` → `RabKomponen::class, 'rab_komponen_id'` |
| `LogAktivitas.php` | + `proyek_id` di `#[Fillable]`. `catat(string $aktivitas, ?int $proyekId = null)` meneruskan `proyek_id`. + `proyek(): BelongsTo` (hanya untuk tampilan, dengan `withDefault()` karena tanpa FK). **Hook `updating`/`deleting` yang melempar `LogicException` tetap ada dan tidak diubah** |
| `Proyek.php` | + `logAktivitas(): HasMany` → `LogAktivitas::class` (untuk timeline) |
| `AppServiceProvider` | Daftarkan `RabKomponen::class` ke loop `observe(AuditTrailObserver::class)` |

`database/factories/RabKomponenFactory.php`: `nama_komponen => fake()->unique()->randomElement([...])` dan `nominal_rencana => '10000000.00'`.

### 1.5 Observer `AuditTrailObserver` — `proyek_id` + label informatif
`catat()` diubah menjadi `LogAktivitas::catat("$aksi $entitas #{$id}: {$this->label($aksi, $model)}", $this->proyekId($model))`.

**`proyekId(Model $model): ?int`**. Jangan menyentuh relasi yang belum dimuat, karena `preventLazyLoading` aktif:
```php
return match (true) {
    $model instanceof Proyek => $model->getKey(),
    $model instanceof Anggaran, $model instanceof LaporanProgres, $model instanceof PengaduanMasyarakat => $model->proyek_id,
    $model instanceof TransaksiPengeluaran, $model instanceof RabKomponen
        => Anggaran::whereKey($model->anggaran_id)->value('proyek_id'),
    default => null,
};
```

**`label(string $aksi, Model $model)`**. Prefiks tetap, detail ditambahkan hanya saat `Update`. Di event `updated`, `getChanges()` dan `getOriginal()` masih memegang nilai lama karena `syncOriginal()` baru dipanggil di `finishSave()`.

| Model | Create / Delete | Update (tambahan setelah label dasar) |
| :--- | :--- | :--- |
| `Proyek` | `nama_proyek` (**tidak berubah**, test `AuthTest:154`) | `pelaksana_id` berubah → ` — pelaksana: {nama}` (`User::whereKey()->value('nama_lengkap')`); `status_proyek` berubah → ` — status: {lama} → {baru}`; `progres_aktual` berubah → ` — progres {lama}% → {baru}%`. Gabung dengan `; ` |
| `Anggaran` | `proyek #{id}` | `pagu_anggaran` berubah → ` — pagu {Rp lama} → {Rp baru}`; `sumber_dana` berubah → ` — sumber dana: {baru}` |
| `RabKomponen` | `{nama_komponen} ({Rp rencana})` | sama dengan Create, memakai nilai baru |
| `TransaksiPengeluaran` | `{uraian} ({Rp nominal})` | sama dengan Create |
| `LaporanProgres` | `proyek #{id} ({persen}%)` (dipertahankan) | `status_verifikasi` berubah → ` — {Disetujui \| Ditolak \| Revisi dikirim}` (`Menunggu` ditulis sebagai "Revisi dikirim") |

- Rupiah di label memakai satu helper `private function rupiah(string $n): string` (`'Rp '.number_format((float) $n, 0, ',', '.')`). Ini teks log, bukan perhitungan, jadi `float` aman di sini.
- `mb_substr(..., 0, 255)` di `LogAktivitas::catat()` tetap menjadi pengaman panjang.
- `rekalkulasi()` memakai `DB::update` mentah, sehingga **tidak** memicu event `Update Anggaran` palsu setiap transaksi dicatat. Pertahankan.

**Pemetaan ke 5 aktivitas penting yang diminta.** Semuanya otomatis lewat observer, tanpa `LogAktivitas::catat()` manual di controller:

| Aktivitas | Pemicu yang sudah ada | Log yang dihasilkan |
| :--- | :--- | :--- |
| Pembuatan proyek | `ProyekController@store` → `Proyek::create` | `Create Proyek #5: Jalan Desa` (+ `Create Anggaran #5: proyek #5`) |
| Perubahan anggaran | `AnggaranController@update`, CRUD komponen | `Update Anggaran #5: proyek #5 — pagu Rp 150.000.000 → Rp 160.000.000` / `Create RabKomponen #12: Material (Rp 40.000.000)` |
| Penugasan pelaksana | `ProyekController@store` (via Create) atau `@update` | `Update Proyek #5: Jalan Desa — pelaksana: TPK Dusun I` |
| Pengiriman progres | `LaporanProgresController@store` / `@update` (pelaksana) | `Create LaporanProgres #9: proyek #5 (50.00%)` |
| Verifikasi laporan | `VerifikasiLaporanController@approve` / `@reject` | `Update LaporanProgres #9: proyek #5 (50.00%) — Disetujui` + `Update Proyek #5: Jalan Desa — progres 30.00% → 50.00%` |

### 1.6 Uraian timeline yang mudah dibaca (tanpa kolom baru)
Tambahkan accessor `uraian` di `LogAktivitas` yang mem-*parse* format terkunci K-4d dengan satu regex `^(Create|Update|Delete) (\w+) #\d+: (.*)$`. Accessor ini hanya membaca, jadi tidak melanggar *read-only*.
```php
private const KATA_KERJA = [
    'Create.Proyek' => 'membuat proyek', 'Update.Proyek' => 'memperbarui proyek', 'Delete.Proyek' => 'menghapus proyek',
    'Create.Anggaran' => 'menetapkan anggaran', 'Update.Anggaran' => 'mengubah anggaran',
    'Create.RabKomponen' => 'menambah komponen rencana', 'Update.RabKomponen' => 'mengubah komponen rencana', 'Delete.RabKomponen' => 'menghapus komponen rencana',
    'Create.TransaksiPengeluaran' => 'mencatat pengeluaran', 'Update.TransaksiPengeluaran' => 'mengubah pengeluaran', 'Delete.TransaksiPengeluaran' => 'menghapus pengeluaran',
    'Create.LaporanProgres' => 'mengirim laporan progres', 'Update.LaporanProgres' => 'memperbarui laporan progres',
    'Create.PengaduanMasyarakat' => 'pengaduan masuk', 'Update.PengaduanMasyarakat' => 'menanggapi pengaduan',
];
```
Hasilnya `['aksi' => 'Update', 'judul' => 'mengubah anggaran', 'detail' => 'pagu Rp … → Rp …']`. Untuk `LaporanProgres` dengan detail `Disetujui`/`Ditolak`, judulnya menjadi `memverifikasi laporan`. Baris yang tidak cocok dengan regex jatuh ke `judul = aktivitas` mentah. Accessor tidak ditambahkan ke `$appends` global, jadi hanya dipanggil lewat `->append('uraian')` oleh controller timeline.

### 1.7 `DatabaseSeeder` — data simulasi
`WithoutModelEvents` dan tidak adanya `auth()` membuat observer diam, jadi komponen dan riwayat diisi eksplisit.

**a. Ubah tuple transaksi** menjadi `[nominal, komponen, uraian]` dan tambahkan peta rencana komponen per proyek. Proyek #1 mereproduksi persis contoh pemilik proyek:

| Proyek (pagu) | Material | Tenaga Kerja | Transportasi | Peralatan | Lain-lain | Realisasi per komponen |
| :--- | ---: | ---: | ---: | ---: | ---: | :--- |
| Jalan Usaha Tani (150 jt) | 40 jt | 30 jt | 10 jt | 40 jt | 30 jt | Material 25+20 = **45** jt, Tenaga Kerja **28** jt, Transportasi **12** jt (total 85 jt) |
| Drainase Dusun II (80 jt) | 35 jt | 30 jt | 5 jt | 10 jt | — | Material 30, Tenaga Kerja 25 |
| Rehab Posyandu (60 jt) | 30 jt | 20 jt | 5 jt | — | 5 jt | Material 32, Tenaga Kerja 20, Lain-lain 8 |
| Sumur Bor Air Bersih (45 jt) | 20 jt | 15 jt | 5 jt | 5 jt | — | Material 20, Peralatan 24 |
| Gapura Desa (25 jt) | 15 jt | 8 jt | 2 jt | — | — | belum ada |
| Renovasi Kantor Desa (90 jt) | 50 jt | 30 jt | 10 jt | — | — | Material 15 |

Totalnya selalu ≤ pagu (K-4e). Transaksi tetap lewat `$service->simpanTransaksi(..., ['rab_komponen_id' => $komponen[$nama]->id, ...])` agar `total_realisasi` dan `sisa_anggaran` dihitung oleh service.

**b. Helper `catatRiwayat(Proyek $p, User $u, string $aktivitas, Carbon $waktu)`**:
```php
(new LogAktivitas)->forceFill([
    'user_id' => $u->id, 'proyek_id' => $p->id, 'aktivitas' => $aktivitas,
    'ip_address' => '127.0.0.1', 'created_at' => $waktu,
])->save(); // insert saja; hook updating/deleting tidak tersentuh
```
Urutan per proyek, relatif terhadap `tanggal_mulai` (`$m`), memakai format string yang **sama persis** dengan keluaran observer:
1. `$m - 7 hari 10:20` pemdes: `Create Proyek #id: {nama}`
2. `$m - 7 hari 11:05` pemdes: `Update Anggaran #id: proyek #id — pagu …` dan satu baris `Create RabKomponen …` per komponen
3. `$m - 7 hari 14:30` pemdes: `Update Proyek #id: {nama} — pelaksana: {nama pelaksana}`
4. Setiap transaksi: pemdes `Create TransaksiPengeluaran …` pada `tanggal_transaksi 09:00`
5. Bila ada laporan: pelaksana `Create LaporanProgres #id: proyek #id ({persen}%)` pada `tanggal_laporan 08:15`, lalu bila sudah diverifikasi: pemdes `Update LaporanProgres … — {status}` pada `verified_at`

Karena itu, `seedLaporan()` mengembalikan `LaporanProgres` agar id-nya bisa dipakai di langkah 5.

---

## 2. Arsitektur Backend

### 2.1 `KalkulasiAnggaranService` — tetap *single source of truth*
Metode lama (`rekalkulasi`, `simpanTransaksi`, `hapusTransaksi`) **tidak diubah**. Tambahan:

```php
/**
 * Rencana vs realisasi per komponen. $anggaran null = agregat seluruh proyek (dikelompokkan per nama_komponen).
 *
 * @return array{baris: list<array{komponen: string, rencana: string, realisasi: string, selisih: string}>,
 *               total: array{rencana: string, realisasi: string, selisih: string}}
 */
public function rencanaVsRealisasi(?Anggaran $anggaran = null): array
```
- **Satu query agregat**: `rab_komponen` LEFT JOIN subquery `SUM(nominal) GROUP BY rab_komponen_id` dari `transaksi_pengeluaran`, `when($anggaran, where anggaran_id)`, lalu `GROUP BY nama_komponen` (mode agregat) atau per `rab_komponen.id` (mode satu anggaran). Subquery dipakai agar SUM rencana tidak terlipat ganda oleh JOIN.
- **Satu query tambahan** untuk transaksi `rab_komponen_id IS NULL` → baris `"Tanpa Komponen"` (rencana `0.00`). Baris ini hanya disertakan bila realisasinya > 0.
- `selisih = bcsub(realisasi, rencana, 2)`. Positif berarti melebihi rencana (merah), negatif berarti hemat (hijau), nol berarti netral. Semua nilai dikirim sebagai **string desimal**, mengikuti cast `decimal:2` yang sudah ada.
- Totalnya dijumlahkan dengan `bcadd`, tidak memakai `float`.

```php
/** @param array<string, mixed> $data */
public function simpanKomponen(Anggaran $anggaran, array $data, ?RabKomponen $lama = null): RabKomponen
```
- Di dalam `DB::transaction()` + `Anggaran::whereKey()->lockForUpdate()` (pola sama dengan `simpanTransaksi`).
- Tolak dengan `ValidationException(['nominal_rencana' => 'Total rencana komponen melebihi pagu anggaran.'])` bila `SUM(nominal_rencana) - lama + baru > pagu` (K-4e).

`AnggaranController@update` ditambah satu cek di dalam transaksi yang sudah ada: pagu baru < `komponen()->sum('nominal_rencana')` → `ValidationException` (K-4f).

### 2.2 Rute baru (`routes/web.php`, grup `role:pemdes`)
```php
Route::resource('proyek', ProyekController::class);   // hapus ->except('show')
Route::get('keuangan/anggaran', [KeuanganController::class, 'anggaran'])->name('keuangan.anggaran');
Route::get('keuangan/pengeluaran', [KeuanganController::class, 'pengeluaran'])->name('keuangan.pengeluaran');
Route::get('keuangan/rencana-realisasi', [KeuanganController::class, 'rencanaRealisasi'])->name('keuangan.rencana-realisasi');
Route::post('proyek/{proyek}/komponen', [RabKomponenController::class, 'store'])->name('komponen.store');
Route::patch('komponen/{komponen}', [RabKomponenController::class, 'update'])->name('komponen.update');
Route::delete('komponen/{komponen}', [RabKomponenController::class, 'destroy'])->name('komponen.destroy');
Route::get('riwayat-proyek', RiwayatProyekController::class)->name('riwayat.index');
```
Rute lama `pemdes.anggaran.show/update` dan `pemdes.transaksi.*` **tetap dipakai**. Form pengeluaran di halaman Keuangan → Pengeluaran mem-POST ke `pemdes.transaksi.store` milik proyek yang dipilih. Tidak ada rute `update`/`delete` baru untuk `log_aktivitas` (test `AuthTest` *read-only* tetap lulus karena URI-nya tidak memuat `audit`/`log-aktivitas`).

### 2.3 Controller & eager loading (`preventLazyLoading` aktif)
Buat dengan `php artisan make:controller Pemdes/KeuanganController --no-interaction`, dst.

| Method | Query | Props Inertia |
| :--- | :--- | :--- |
| `ProyekController@show` | `$proyek->load(['pelaksana:id,nama_lengkap', 'anggaran.komponen', 'laporanProgres' => fn ($q) => $q->latest('tanggal_laporan')->latest('id')->limit(5)->with('foto', 'verifikator:id,nama_lengkap'), 'dokumentasiFoto:id,proyek_id,tahap,file_path,created_at'])`. Transaksi: `$proyek->anggaran->transaksi()->with('komponen:id,nama_komponen')->latest('tanggal_transaksi')->limit(10)->get()`. Riwayat: `$proyek->logAktivitas()->with('user:id,nama_lengkap,role')->latest('id')->limit(8)->get()->each->append('uraian')` | `proyek`, `anggaran` (+`persentase_serapan`), `rencana` (`service->rencanaVsRealisasi($proyek->anggaran)`), `transaksi`, `laporan`, `foto` (dikelompokkan per tahap Sebelum/Saat/Sesudah di frontend), `riwayat`, `risiko` (`AnalisisRisikoService`, pola sama dengan Monitoring) |
| `KeuanganController@anggaran` | `Anggaran::with('proyek:id,nama_proyek,status_proyek')->withCount('komponen')->withSum('komponen', 'nominal_rencana')->orderByDesc('tahun_anggaran')->paginate(10)` + total pagu/realisasi/sisa via satu `selectRaw SUM` | `anggaran` (paginasi), `ringkasan` |
| `KeuanganController@pengeluaran` | `TransaksiPengeluaran::with('anggaran:id,proyek_id', 'anggaran.proyek:id,nama_proyek', 'komponen:id,nama_komponen', 'pembuat:id,nama_lengkap')`, filter `proyek` (`whereHas('anggaran', ...)` diganti `whereIn('anggaran_id', Anggaran::where('proyek_id', ..)->select('id'))`), `komponen`, `dari`/`sampai` → `latest('tanggal_transaksi')->paginate(15)->withQueryString()` | `transaksi`, `filter`, `proyekPilihan` (`Proyek::with('anggaran.komponen:id,anggaran_id,nama_komponen')->orderBy('nama_proyek')->get(['id','nama_proyek'])`) untuk dropdown form dan filter |
| `KeuanganController@rencanaRealisasi` | `?proyek=` opsional (validasi `exists:proyek,id`). Bila ada: `Proyek::with('anggaran')->findOrFail()` → `service->rencanaVsRealisasi($anggaran)`. Bila tidak ada: `service->rencanaVsRealisasi()` (agregat) | `data`, `proyekPilihan` (`id`, `nama_proyek`), `filter` |
| `RabKomponenController@store/update/destroy` | `store`: `$proyek->anggaran()->firstOrFail()` → `service->simpanKomponen()`. `update`: `$komponen->anggaran` di-`load` dulu. `destroy`: `abort_if($komponen->transaksi()->exists(), 422, 'Komponen sudah memiliki transaksi.')` lalu `delete()` | redirect `back()->with('success', …)` |
| `RiwayatProyekController` (invokable) | Daftar kiri: `Proyek::withMax('logAktivitas', 'created_at')->withCount('logAktivitas')->orderByDesc('log_aktivitas_max_created_at')->get(['id','nama_proyek','status_proyek'])`. Timeline: `LogAktivitas::with('user:id,nama_lengkap,role')->where('proyek_id', $dipilih)->latest('id')->paginate(30)->withQueryString()` lalu `through(fn ($l) => $l->append('uraian'))` | `proyek`, `dipilih`, `riwayat` (paginasi) |

Catatan:
- `AnggaranController@show` ditambah `'komponen' => $anggaran->komponen()->orderBy('nama_komponen')->get()` dan `'rencana' => service->rencanaVsRealisasi($anggaran)`. Transaksinya di-*eager load* `with('komponen:id,nama_komponen')`.
- `LaporanProgres` perlu relasi `verifikator()` (`belongsTo(User::class, 'verified_by')`). Cek dulu di model, karena mungkin sudah ada dengan nama lain.

### 2.4 Form Request
- `app/Http/Requests/Pemdes/RabKomponenRequest.php` (**baru**): `nama_komponen` `required|string|max:100` + `Rule::unique('rab_komponen')->where('anggaran_id', …)->ignore($this->route('komponen'))`; `nominal_rencana` `required|numeric|gt:0|max:9999999999999.99`.
- `TransaksiRequest`: + `'rab_komponen_id' => ['nullable', 'integer', Rule::exists('rab_komponen', 'id')->where('anggaran_id', $anggaranId)]`. `$anggaranId` diambil dari `route('transaksi')?->anggaran_id` atau `Anggaran::where('proyek_id', route('proyek')->id)->value('id')`. Karena nullable, **semua test transaksi lama tetap lulus**. Pengaman lintas-proyek ini wajib ada di batas kepercayaan.

---

## 3. Navigasi Sidebar (`AuthenticatedLayout.jsx`)

### 3.1 Struktur `MENU.pemdes` baru
```js
pemdes: [
    { label: 'Dashboard', route: 'pemdes.dashboard', icon: LayoutDashboard },
    { label: 'Proyek', route: 'pemdes.proyek.index', match: ['pemdes.proyek.*'], icon: FolderKanban },
    {
        label: 'Keuangan', icon: Wallet, children: [
            { label: 'Anggaran', route: 'pemdes.keuangan.anggaran', match: ['pemdes.keuangan.anggaran', 'pemdes.anggaran.*'] },
            { label: 'Pengeluaran', route: 'pemdes.keuangan.pengeluaran' },
            { label: 'Rencana vs Realisasi', route: 'pemdes.keuangan.rencana-realisasi' },
        ],
    },
    { label: 'Riwayat Proyek', route: 'pemdes.riwayat.index', icon: History },
    { label: 'Monitoring Risiko', ... }, // sisanya tidak berubah
],
```
Ikon baru dari `lucide-react` yang sudah terpasang: `Wallet`, `History`, `ChevronDown`.

### 3.2 Render item ber-`children` (hanya cabang baru di `menu.map`, item datar tidak berubah)
- State `const [grupTerbuka, setGrupTerbuka] = useState({})`. Grup terbuka bila `grupTerbuka[label] ?? children.some(aktif)`, jadi otomatis terbuka saat salah satu anaknya aktif.
- Tombol induk: `<button type="button" aria-expanded={buka} aria-controls={`grup-${label}`}>` dengan gaya yang sama seperti item datar. Indikator aktif `border-red-500` muncul pada induk bila salah satu anaknya aktif. `ChevronDown` berputar `rotate-180` saat terbuka.
- Daftar anak: `<ul id=… className="mt-1 ml-7 space-y-1 border-l border-slate-800 pl-3">`. Anak aktif memakai `text-white` + titik merah `before:h-1.5 before:w-1.5 before:rounded-full before:bg-red-500` (A-18: merah hanya sebagai indikator, bukan blok). Anak non-aktif memakai `text-slate-400 hover:text-white`.
- Klik anak memanggil `setTerbuka(false)` (menutup drawer mobile), sama seperti item datar.
- `key` item memakai `nama ?? label`, karena grup tidak punya `route`.

Judul `Pemdes/Proyek/Index` diganti dari "Proyek & Keuangan" menjadi "Proyek". Tombol "Kembali" di `Anggaran/Show` diarahkan ke `pemdes.keuangan.anggaran`.

---

## 4. Rancangan UI — Bento Box Grid (Merah · Putih · Slate)

Aturan bersama: semua halaman memakai `<BentoGrid>` (`grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-5`) dan kelas span dari `UI-POLISH.md §2.2` (jangan memakai `col-span-*` tanpa prefiks). Setiap halaman punya minimal satu baris asimetris 8/4 atau 7/5. Merah hanya untuk aksi utama, angka kritis, dan bar realisasi. Chart dibungkus `relative h-72 w-full`.

**Indikator selisih** (satu komponen kecil `resources/js/Components/Selisih.jsx`, dipakai di 3 halaman):
- `> 0`: `text-red-600`, ikon `TrendingUp`, teks `+Rp 5.000.000` (melebihi rencana)
- `< 0`: `text-emerald-600`, ikon `TrendingDown`, teks `−Rp 2.000.000` (hemat)
- `= 0`: `text-slate-500`, teks `Sesuai rencana`
- Ikon diberi `aria-hidden`, dan tanda +/− tetap tertulis sehingga makna tidak bergantung pada warna saja.

`FormTransaksi` dipindahkan dari `Pages/Pemdes/Anggaran/Show.jsx` ke `resources/js/Components/FormTransaksi.jsx` (+ prop `komponen` untuk dropdown `rab_komponen_id` berisi opsi kosong "Tanpa Komponen"), lalu dipakai di `Anggaran/Show`, `Keuangan/Pengeluaran`, dan `Proyek/Show`. Jangan menyalin form.

### 4.1 Keuangan → Anggaran (`Pages/Pemdes/Keuangan/Anggaran.jsx`)
```
┌ StatCard Total Pagu (3) ┬ Total Realisasi (3) ┬ Sisa (3) ┬ Serapan % (3) ┐
├─ Tabel Anggaran per Proyek (lg:8) ───────────┬─ Doughnut Serapan (lg:4) ──┤
│ Proyek · Tahun · Sumber · Pagu · Realisasi · │ realisasi (merah) vs sisa   │
│ ProgressBar serapan · #komponen · [Kelola →] │ (slate-300), total di tengah│
└──────────────────────────────────────────────┴─────────────────────────────┘
```
"Kelola" membuka `pemdes.anggaran.show`. Halaman itu (sudah ada) ditambah kartu **Rincian Komponen Rencana** (`lg:col-span-4`): daftar komponen + nominal + tombol ubah/hapus inline, form tambah `nama_komponen` (datalist saran: Material, Tenaga Kerja, Transportasi, Peralatan, Lain-lain) + `nominal_rencana`, serta baris "Belum dialokasikan: Rp X" (pagu − total rencana). Kolom "Komponen" juga ditambahkan di tabel transaksi.

### 4.2 Keuangan → Pengeluaran (`Pages/Pemdes/Keuangan/Pengeluaran.jsx`)
```
┌─ Filter (lg:12): Proyek ▾ · Komponen ▾ · Dari · Sampai · [Terapkan] ──────────┐
├─ Daftar Transaksi (lg:8) ─────────────────────┬─ Catat Pengeluaran (lg:4) ────┤
│ Tanggal · Proyek · Jenis (komponen badge) ·    │ Proyek ▾ (memuat komponen)    │
│ Uraian/keterangan · Nominal (tabular-nums) ·   │ <FormTransaksi komponen=…/>   │
│ Bukti (ikon tautan) · Ubah/Hapus · Pagination  │ tanggal · jenis · nominal ·   │
│                                                │ keterangan · bukti            │
└────────────────────────────────────────────────┴───────────────────────────────┘
```
- **"Keterangan" = kolom `uraian` yang sudah ada** (label UI saja, tanpa kolom baru). "Jenis pengeluaran" = dropdown komponen.
- Pada mobile, tabel `overflow-x-auto min-w-[640px]`. Kartu form turun ke bawah daftar.
- Pesan error nominal dari service ("melebihi sisa pagu") tampil di bawah field.

### 4.3 Keuangan → Rencana vs Realisasi (`Pages/Pemdes/Keuangan/RencanaRealisasi.jsx`)
```
┌─ Pilih Proyek ▾ (Semua proyek | nama…) (lg:12) ───────────────────────────────┐
├ StatCard Total Rencana (4) ┬ Total Realisasi (4) ┬ Selisih Total <Selisih/> (4)┤
├─ Bar Chart per Komponen (lg:7) ──────────────┬─ Tabel Perbandingan (lg:5) ────┤
│ grouped bar: Rencana = WARNA_CHART.slateMuda │ Komponen · Rencana · Realisasi │
│ Realisasi = WARNA_CHART.merah; label sumbu    │ · Selisih <Selisih/> · % thd   │
│ dipotong potongLabel; tooltip formatRupiah    │ rencana; baris Total (bold)    │
└──────────────────────────────────────────────┴────────────────────────────────┘
```
- Chart: `<Bar>` dari `react-chartjs-2`, `import '@/chartSetup'` (sudah meregistrasi `BarElement`). `ticks.callback` sumbu Y memakai format ringkas `Rp 40 jt`.
- Contoh tampilan (Jalan Usaha Tani): Material 40 jt / 45 jt / **+5 jt** merah · Tenaga Kerja 30 jt / 28 jt / **−2 jt** hijau · Transportasi 10 jt / 12 jt / **+2 jt** merah · Peralatan 40 jt / 0 / −40 jt hijau · Lain-lain 30 jt / 0 / −30 jt hijau.
- Bila tidak ada komponen sama sekali: `EmptyState` "Belum ada rincian komponen rencana" + tautan ke `pemdes.anggaran.show`.

### 4.4 Detail Proyek (`Pages/Pemdes/Proyek/Show.jsx`, rute `pemdes.proyek.show`)
```
┌─ Hero (lg:8): nama, StatusBadge, kategori, lokasi, pelaksana, ┬─ dark card (lg:4)──┐
│ periode, deskripsi; ProgressBar aktual vs target              │ Risiko + Aksi cepat│
│                                                               │ [Ubah Proyek]      │
│                                                               │ [Kelola Anggaran]  │
│                                                               │ [Verifikasi Lap.]  │
│                                                               │ [Lihat Riwayat]    │
├ StatCard Pagu (3) ┬ Realisasi (3) ┬ Sisa (3) ┬ Progres Fisik % (3) ─────────────────┤
├─ Rencana vs Realisasi (lg:7): mini bar chart ─┬─ Riwayat Terbaru (lg:5) ───────────┤
│ + tabel ringkas dengan <Selisih/>             │ <TimelineRiwayat items limit 8/>    │
│                                               │ "Lihat semua →" riwayat?proyek=id  │
├─ Laporan Progres (lg:5): 5 terakhir,          ┬─ Dokumentasi 3 Tahap (lg:7) ───────┤
│ persen, tanggal, StatusBadge, verifikator,    │ 3 kolom Sebelum · Saat · Sesudah,   │
│ catatan revisi                                │ thumbnail → <Lightbox/>; EmptyState │
├─ Pengeluaran Terakhir (lg:12): 10 transaksi + komponen + "Lihat semua →" ─────────┤
└─────────────────────────────────────────────────────────────────────────────────────┘
```
- Tautan nama proyek di `Pemdes/Proyek/Index` diarahkan ke `pemdes.proyek.show`.
- "Lihat semua" pengeluaran → `pemdes.keuangan.pengeluaran?proyek={id}`.
- Pola galeri tahap + Lightbox mengikuti `Pages/Pelaksana/Proyek/Show.jsx` yang sudah ada. Gunakan ulang strukturnya, jangan buat varian baru.

### 4.5 Riwayat Proyek (`Pages/Pemdes/Riwayat/Index.jsx`) + `Components/TimelineRiwayat.jsx`
```
┌─ Daftar Proyek (lg:4) ───────────┬─ Timeline: {nama proyek} (lg:8) ─────────────────┐
│ cari nama (filter client-side)   │  ── Hari ini ──────────────────────────────────  │
│ ▸ Jalan Usaha Tani   · 14 log    │  ● 14:30  Kepala Desa (Pemdes)                    │
│   terakhir 2 jam lalu            │  │        memperbarui proyek                      │
│ ▸ Drainase Dusun II  · 9 log     │  │        pelaksana: TPK Dusun I                  │
│ (aktif: border-l merah)          │  ● 11:05  mengubah anggaran — pagu Rp… → Rp…      │
│                                  │  ── 02 Sep 2026 ───────────────────────────────  │
│                                  │  ● 08:15  TPK Dusun I (Pelaksana)                 │
│                                  │           mengirim laporan progres (50.00%)       │
│                                  │  ── 03 Sep 2026 ──  ● memverifikasi laporan ✓     │
│                                  │  <Pagination/>                                    │
└──────────────────────────────────┴───────────────────────────────────────────────────┘
```
`TimelineRiwayat` (komponen bersama untuk Detail Proyek dan halaman Riwayat):
- `<ol className="relative ml-3 border-l border-slate-200">`. Tiap `<li className="ml-6 pb-5">` punya titik `absolute -left-[7px] h-3.5 w-3.5 rounded-full ring-4 ring-white`. Warna titik mengikuti `aksi`: Create `bg-slate-800`, Update `bg-slate-400`, Delete `bg-red-600`, verifikasi Disetujui `bg-emerald-500`, Ditolak `bg-red-600`.
- Pemisah tanggal dihitung di frontend dengan mengelompokkan `created_at` per hari (`formatTanggal`, label "Hari ini"/"Kemarin"). Jam memakai `<time dateTime={iso}>` + `toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })`.
- Baris 1: jam (`text-xs font-semibold tabular-nums text-slate-500`) + aktor `user.nama_lengkap` + badge role kecil. Baris 2: `uraian.judul` (`text-sm font-semibold text-slate-900`). Baris 3: `uraian.detail` (`text-sm text-slate-600`).
- Log dengan `user` null (akun terhapus) ditampilkan sebagai "Sistem".
- Tanpa data: `EmptyState icon={History}` "Belum ada riwayat untuk proyek ini".
- Mobile: kolom daftar proyek menjadi `<select>` di atas timeline (`lg:hidden`), sedangkan daftar kartu memakai `hidden lg:block`.
- Navigasi memakai `router.get(route('pemdes.riwayat.index'), { proyek: id }, { preserveState: true, preserveScroll: true })`.

---

## 5. Pengujian (`php artisan make:test --phpunit PemdesExtraTest`)

Pakai factory (`RabKomponenFactory` baru, `UserFactory`). Minimal:
1. `rencana_vs_realisasi_menghitung_selisih_per_komponen`: data contoh 40/45, 30/28, 10/12 → selisih `5000000.00`, `-2000000.00`, `2000000.00`. Transaksi tanpa komponen muncul sebagai "Tanpa Komponen".
2. `total_rencana_komponen_tidak_boleh_melebihi_pagu` (K-4e) dan `pagu_tidak_boleh_di_bawah_total_rencana` (K-4f).
3. `transaksi_menolak_komponen_milik_proyek_lain` (validasi `exists` ber-scope).
4. `transaksi_tanpa_komponen_tetap_bisa_dicatat` (backward-compat).
5. `komponen_yang_punya_transaksi_tidak_bisa_dihapus`.
6. `observer_mencatat_proyek_id_dan_label_informatif`: ganti pelaksana → `Update Proyek #x: … — pelaksana: …` dengan `proyek_id = x`. Approve laporan → `… — Disetujui`. Transaksi → `proyek_id` terisi tanpa `LazyLoadingViolationException`.
7. `log_aktivitas_tetap_read_only_setelah_kolom_proyek_id` (update/delete tetap melempar `LogicException`).
8. `halaman_detail_keuangan_dan_riwayat_dirender`: `assertInertia` untuk `Pemdes/Proyek/Show`, `Pemdes/Keuangan/{Anggaran,Pengeluaran,RencanaRealisasi}`, `Pemdes/Riwayat/Index`. Role `pelaksana` mendapat 403.
9. `seeder_menghasilkan_komponen_dan_riwayat` (`$this->seed()`): proyek pertama punya 5 komponen, Material realisasi `45000000.00`, dan log ber-`proyek_id` > 0.

Definisi selesai: `php artisan test --compact` hijau (74 test lama + test baru), `vendor/bin/pint --dirty --format agent`, `npm run build` sukses, `graphify update .`, lalu perbarui `PROGRESS.md` (K-4 di §0, checklist "Fitur Pemdes Ekstra", daftar file).

---

## 6. Urutan Kerja

1. Kunci **K-4** di `PROGRESS.md §0`, lalu perbarui `docs/DATABASE.md` dan `docs/PRD.md`.
2. Migration §1.1–1.3 → model & factory §1.4 → daftarkan observer `RabKomponen`.
3. `AuditTrailObserver` (`proyekId`, `label`) + `LogAktivitas` (`catat` ber-`proyek_id`, accessor `uraian`) → test 6–7.
4. `KalkulasiAnggaranService::rencanaVsRealisasi()` + `simpanKomponen()` + cek K-4f → test 1–2.
5. `RabKomponenRequest`, `TransaksiRequest`, `RabKomponenController`, rute → test 3–5.
6. `ProyekController@show`, `KeuanganController`, `RiwayatProyekController` → test 8.
7. Frontend: `Selisih`, `FormTransaksi` (dipindah), `TimelineRiwayat`, sidebar grup, lalu 5 halaman.
8. `DatabaseSeeder` §1.7 → test 9 → `php artisan migrate:fresh --seed` untuk uji visual (375/768/1280 px).

### Daftar file
| Baru | Diubah |
| :--- | :--- |
| 3 migration `2026_11_22_00000{1,2,3}_*` · `app/Models/RabKomponen.php` · `database/factories/RabKomponenFactory.php` · `app/Http/Controllers/Pemdes/{KeuanganController,RabKomponenController,RiwayatProyekController}.php` · `app/Http/Requests/Pemdes/RabKomponenRequest.php` · `resources/js/Components/{Selisih,FormTransaksi,TimelineRiwayat}.jsx` · `resources/js/Pages/Pemdes/Keuangan/{Anggaran,Pengeluaran,RencanaRealisasi}.jsx` · `resources/js/Pages/Pemdes/Proyek/Show.jsx` · `resources/js/Pages/Pemdes/Riwayat/Index.jsx` · `tests/Feature/PemdesExtraTest.php` | `app/Models/{Anggaran,TransaksiPengeluaran,LogAktivitas,Proyek,LaporanProgres}.php` · `app/Observers/AuditTrailObserver.php` · `app/Providers/AppServiceProvider.php` · `app/Services/KalkulasiAnggaranService.php` · `app/Http/Controllers/Pemdes/{AnggaranController,ProyekController}.php` · `app/Http/Requests/Pemdes/TransaksiRequest.php` · `routes/web.php` · `database/seeders/DatabaseSeeder.php` · `resources/js/Layouts/AuthenticatedLayout.jsx` · `resources/js/Pages/Pemdes/{Anggaran/Show,Proyek/Index}.jsx` · `docs/DATABASE.md` · `docs/PRD.md` · `PROGRESS.md` |
