<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

## Foundational Context

This application is a Laravel application running on PHP 8.4. Always use the APIs that match the installed major version of each package — do not assume a version.

Before relying on a package's API, confirm its installed version:
- PHP packages: run `composer show --direct` to list direct dependencies with versions, or `composer show <vendor/package>` for a single package.
- JS packages: check `package.json` for the installed versions.

## Skills Activation

This project has domain-specific skills available in `**/skills/**`. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If a frontend change doesn't show in the UI or you get a "Unable to locate file in Vite manifest" error, run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

=== boost rules ===

# Laravel Boost

## Tools

- Laravel Boost is an MCP server with tools designed specifically for this application. Prefer Boost tools over manual alternatives like shell commands or file reads.
- Use `database-query` to run read-only queries against the database instead of writing raw SQL in tinker.
- Use `database-schema` to inspect table structure before writing migrations or models.
- Use `get-absolute-url` to resolve the correct scheme, domain, and port for project URLs. Always use this before sharing a URL with the user.
- Use `browser-logs` to read browser logs, errors, and exceptions. Only recent logs are useful, ignore old entries.

## Searching Documentation (IMPORTANT)

- Use `search-docs` before changes that depend on Laravel ecosystem APIs, behavior, configuration, or version-specific syntax. Skip it for copy-only edits and other changes where package documentation is irrelevant. Reuse sufficient results already in context instead of searching again.
- Pass a `packages` array to scope results when you know which packages are relevant.
- Use multiple broad, topic-based queries: `['rate limiting', 'routing rate limiting', 'routing']`. Expect the most relevant results first.
- Do not add package names to queries because package info is already shared. Use `test resource table`, not `filament 4 test resource table`.

### Search Syntax

1. Use words for auto-stemmed AND logic: `rate limit` matches both "rate" AND "limit".
2. Use `"quoted phrases"` for exact position matching: `"infinite scroll"` requires adjacent words in order.
3. Combine words and phrases for mixed queries: `middleware "rate limit"`.
4. Use multiple queries for OR logic: `queries=["authentication", "middleware"]`.

## Project Rules

- This project contains committed, area-grouped rules in `.ai/rules` when that directory exists, including path-scoped framework guidelines under `.ai/rules/boost`. Before you enter plan mode or create/edit any file, you MUST first: open @.ai/rules/index.md (it maps file globs to rule files), read every rule file whose globs cover the path(s) in scope, and run `grep -rin 'keyword' .ai/rules` to catch what a path match alone misses. Do not write code until you have read and are following every matching rule. If `.ai/rules` does not exist, continue without it.

## Artisan

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
- Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `php artisan tinker --execute 'Your::code();'`
  - Double quotes for PHP strings inside: `php artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== deployments rules ===

# Deployment

- Laravel can be deployed using [Laravel Cloud](https://cloud.laravel.com/), which is the fastest way to deploy and scale production Laravel applications.
- Activate the `deploying-to-cloud` skill whenever deploying to Laravel Cloud, configuring Cloud environments or resources, using the Cloud CLI, or troubleshooting Cloud deployments.

=== inertia-laravel/core rules ===

# Inertia

- Inertia creates fully client-side rendered SPAs without modern SPA complexity, leveraging existing server-side patterns.
- Components live in `resources/js/Pages` (unless specified in `vite.config.js`). Use `Inertia::render()` for server-side routing instead of Blade views.
- ALWAYS use `search-docs` tool for version-specific Inertia documentation and updated code examples.
- IMPORTANT: Activate `inertia-react-development` when working with Inertia client-side patterns.

# Inertia v2

- Use all Inertia features from v1 and v2. Check the documentation before making changes to ensure the correct approach.
- New features: deferred props, infinite scroll, merging props, polling, prefetching, once props, flash data.
- When using deferred props, add an empty state with a pulsing or animated skeleton.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

## APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== phpunit/core rules ===

# PHPUnit

- This project uses PHPUnit. Create tests with `php artisan make:test --phpunit {name}`.
- Do not include the test suite directory in `{name}`. Use `SomeFeatureTest`, not `Feature/SomeFeatureTest`.
- Read the `testing-best-practices` skill for guidance on coverage, naming, structure, dependency isolation, and review.

## Running Tests

- Run the narrowest set of tests that covers the change. Pass a file path or `--filter=testName` to `php artisan test --compact`.
- Rerun a test after each change to it.
- Run `vendor/bin/phpunit` to call the test runner directly. It accepts the same file path and `--filter=testName` arguments.

=== inertia-react/core rules ===

# Inertia + React

- IMPORTANT: Activate `inertia-react-development` when working with Inertia React client-side patterns.

</laravel-boost-guidelines>

---

# SIMBANGDES — Project Guidelines & Guardrails

Anda adalah Senior Full-Stack Developer (**Laravel 13 + PHP 8.4 + Inertia.js v2 + React 19 + Tailwind CSS v4**) yang bertugas membangun **SIMBANGDES (Sistem Informasi Manajemen Pembangunan dan Transparansi Desa)**.

## 1. Peta Dokumentasi (`docs/`) — Penunjuk Arah

Selalu baca dokumen terkait di folder `docs/` sebelum membuat migrasi, logika bisnis, rute, maupun komponen antarmuka:

- `docs/PRD.md` — Visi produk, ruang lingkup (_In-Scope_ & _Out-of-Scope_), 7 modul fungsional (`FR-01` s.d. `FR-07`), dan NFR.
- `docs/TECH-STACK.md` — Versi library, konfigurasi lingkungan, dan standar keamanan.
- `docs/DATABASE.md` — Skema 8 tabel final (`users`, `log_aktivitas`, `proyek`, `anggaran`, `transaksi_pengeluaran`, `laporan_progres`, `dokumentasi_foto`, `pengaduan_masyarakat`), ERD, dan urutan migrasi.
- `docs/ARCHITECTURE.md` — Pola arsitektur _Monolith-Hybrid_ (Laravel + Inertia + React), struktur folder, pembagian _middleware_ RBAC, dan routing.
- `docs/BUSINESS-RULES.md` — Rumus kalkulasi anggaran, deteksi keterlambatan proyek, siklus verifikasi laporan, dan aturan visibilitas publik.
- `PROGRESS.md` — Catatan progres pengerjaan proyek di root direktori untuk kesinambungan antar-sesi.

## 2. Aturan Wajib Proyek (_Hard Constraints_)

1. **Tanpa Integrasi Eksternal:** DILARANG membuat fitur integrasi/API ke SISKEUDES, SIPD, atau _payment gateway_.
2. **Role Statis & Akses Publik Tanpa Login:** Hak akses dikunci hanya pada 3 peran di tabel `users` (`admin`, `pemdes`, `pelaksana`). Masyarakat (`guest`) mengakses portal publik **tanpa login/registrasi**. Jangan membuat halaman CRUD role dinamis.
3. **Kepatuhan Skema Database:** Ikuti nama tabel dan nama kolom di `docs/DATABASE.md` secara persis. Jangan menambah atau mengubah kolom di luar spesifikasi tersebut.
4. **Presisi Finansial & Progres:** Gunakan `DECIMAL(15,2)` untuk seluruh nominal uang dan `DECIMAL(5,2)` untuk persentase fisik. Bungkus perubahan keuangan (`transaksi_pengeluaran` & `anggaran`) di dalam `DB::transaction()`.
5. **Audit Trail Read-Only:** Setiap aktivitas penting (`Login`, `Logout`, `Create`, `Update`, `Delete`) wajib dicatat ke tabel `log_aktivitas`. Data pada tabel ini tidak boleh memiliki rute atau tombol `update` maupun `delete`.
6. **Keamanan PDF & Unggah Berkas:** Set `'isRemoteEnabled' => false` pada konfigurasi `Dompdf` untuk mencegah SSRF. Batasi unggahan foto maksimal `5 MB` dengan validasi MIME (`jpg,jpeg,png,webp`) dan nama file ter-hash.

## 3. Standar Desain UI/UX & Dashboard

1. **Palet Warna Identitas:** Gunakan dominasi **Merah (`red-600` / `red-700`)**, **Putih (`white` / `slate-50`)**, dan **Abu-abu Gelap (`slate-800` / `slate-900`)** dengan Tailwind CSS.
2. **Tema Bento Box Grid Layout (WAJIB):**
   - Seluruh halaman (baik Portal Publik maupun Panel Internal) **wajib** disusun menggunakan gaya **Bento Box Grid Layout** (susunan grid CSS responsif yang modular dan bersih dengan proporsi kartu variatif seperti `col-span-12`, `lg:col-span-8`, `lg:col-span-4`).
   - Setiap blok konten dibungkus dalam kartu bergaya Bento (`bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5` atau `p-6`) dengan jarak antar-kartu yang konsisten (`gap-4` atau `gap-6`) dan hierarki tipografi yang tegas.
3. **Visualisasi Grafik pada Semua Dashboard Login (WAJIB):**
   - Setiap halaman _Dashboard_ untuk seluruh peran terautentikasi (`admin`, `pemdes`, dan `pelaksana`) **wajib** menggunakan pustaka grafik (_chart library_ seperti `chart.js` + `react-chartjs-2` atau `recharts`) selain kartu ringkasan angka:
     - **Dashboard Pemdes:** Grafik perbandingan Pagu vs. Realisasi Anggaran dan distribusi Status Proyek (Berjalan, Selesai, Terlambat).
     - **Dashboard Pelaksana:** Grafik progres fisik per proyek yang ditugaskan serta ringkasan status laporan (Menunggu, Disetujui, Ditolak).
     - **Dashboard Admin:** Grafik tren aktivitas sistem / riwayat login harian serta komposisi pengguna aktif per _role_.

## 4. Pencatatan Progres & Kontinuitas Sesi (WAJIB)

Gunakan file standar **`PROGRESS.md`** di root proyek (`simbangdes/PROGRESS.md`) sebagai memori lintas sesi agar pekerjaan dapat dilanjutkan kapan saja tanpa kehilangan konteks:

1. **Saat Memulai Sesi:** Selalu periksa dan baca `PROGRESS.md` (jika sudah ada) sebelum menulis kode untuk mengetahui tahap terakhir yang selesai dan melanjutkan ke tugas berikutnya.
2. **Setiap Selesai Menyelesaikan Tugas:** Setelah menyelesaikan suatu fitur, migrasi, atau perbaikan dan memastikan tidak ada error, **wajib** membuat atau memperbarui `PROGRESS.md` menggunakan format standar Markdown:
   - **Ringkasan Status Terakhir:** Cantumkan tanggal/sesi, modul yang baru selesai, dan **Langkah Selanjutnya (*Next Step*)** yang spesifik.
   - **Checklist Tahapan Pengembangan:** Gunakan kotak centang standar (`- [x]` untuk selesai, `- [ ]` untuk belum dikerjakan) yang mencakup fase Setup & Database, Auth & RBAC, Modul Pemdes, Modul Pelaksana, Modul Admin, Portal Publik, serta Pengujian.
   - **Daftar File Utama yang Dibuat/Diubah:** Catat secara ringkas agar sesi berikutnya tidak mengulang atau menimpa kode yang sudah berjalan.
3. **Pisahkan Log dari Aturan:** Jangan menuliskan log progres ke dalam `CLAUDE.md` agar file panduan ini tetap ringkas; seluruh pembaruan status dicatat secara eksklusif di `PROGRESS.md`.

## 5. Penggunaan Plugin & Tools

- **Ponytail:** Gunakan alur kerja atau komponen dari plugin Ponytail sesuai fungsinya saat mengerjakan antarmuka UI atau otomasi terkait.
- **Graphify:** Ikuti aturan navigasi dan pembaruan *knowledge graph* pada bagian `## graphify` di bawah ini.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. When the answer is under a Markdown heading, `graphify section "<heading>"` prints that section's text, so the .md need not be opened. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
