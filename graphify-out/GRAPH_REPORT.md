# Graph Report - PplProject  (2026-11-21)

## Corpus Check
- 234 files · ~96,017 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 21 file(s) not represented in the graph (top: (none) 17, .example 1, .xml 1)

## Summary
- 1651 nodes · 3135 edges · 135 communities (96 shown, 39 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 305 edges (avg confidence: 0.92)
- Token cost: 170,941 input · 0 output

## Community Hubs (Navigation)
- PRD.md - Product Requirements Document
- composer.json
- Table proyek
- TransaksiPengeluaran
- dependencies
- Project Guidelines & UI Rules
- Illuminate\Database\Schema\Blueprint
- Budget Sync & Audit Trail
- Public Portal & Complaints
- Illuminate\Http\Request
- Composer Scripts
- Composer Plugins
- Laravel Boost Setup
- PROGRESS — SIMBANGDES
- TestCase
- ProyekController.php
- AuthTest
- PublikTest
- Robots.txt
- Inertia\Testing\AssertableInertia
- Cloud CLI
- Inertia React Development
- TECH_STACK.md - Technology Stack & UI Design System
- Process
- Security best practices
- Audit Trail Immutability (no UPDATE/DELETE on log_aktivitas)
- Detection checklist
- Tailwind CSS development
- Defense in Depth Security Architecture
- Advanced query best practices
- Events and notifications best practices
- Queue and job best practices
- Illuminate\Database\Eloquent\Factories\Factory
- Brand Color Palette (Red, White, Slate) & Semantic Status Colors
- Caching best practices
- Migration best practices
- AppServiceProvider.php
- require
- require-dev
- @inertiajs/react
- Blade and view best practices
- laravel-best-practices/SKILL.md
- Eloquent best practices
- Error handling best practices
- Task scheduling best practices
- Endpoint tests
- AnggaranController.php
- Collection best practices
- HTTP client best practices
- Mail best practices
- Routing and controller best practices
- Validation and forms best practices
- Assertions
- testing-best-practices/SKILL.md
- Fakes, mocks, and determinism
- Configuration best practices
- Test suite performance
- Reviewing tests
- DatabaseSeeder
- psr-4
- autoload-dev
- extra
- laravel-boost
- devDependencies
- index.js
- Database performance best practices
- Inertia\Response
- dependencies
- KalkulasiAnggaranService
- 2. Standar Desain Bento Box Grid Modern (Merah – Putih – Slate)
- DESIGN-SYSTEM — Perombakan Total Antarmuka SIMBANGDES
- Illuminate\Http\RedirectResponse
- App\Http\Controllers\Admin\UserManagementController
- Illuminate\Foundation\Http\FormRequest
- PemdesTest
- 1.3 Eloquent Model (8 berkas di `app/Models/`)
- Illuminate\Database\Eloquent\Model
- TransaksiPengeluaran
- BeritaPengumuman
- lucide-react
- Convention and style best practices
- KeamananTest
- App\Http\Controllers\Admin\AuditTrailController
- 3. Komponen UI (`resources/js/Components/UI/`)
- Log Sesi 1 — Fase 1 (2026-11-21)
- Modal.jsx
- CheckActiveUser.php
- Fase 3 — Modul Pemdes
- PelaksanaAdminTest
- App\Http\Controllers\Publik\ProyekPublikController
- PublikExtraTest
- Illuminate\Http\Request
- PublikTest.php
- PemdesTest.php
- Log Sesi 11 — Perombakan UI Gelombang 1 (2026-11-22)
- PelaksanaAdminTest.php
- PublicLayout.jsx
- Anggaran.php
- DataTable.jsx
- PemdesExtraTest
- KeuanganController.php
- PemdesExtraTest.php
- UI/StatusBadge.jsx
- App\Http\Controllers\Publik\StatistikController
- format.js
- .setUp
- Callout.jsx
- 4. Rancangan UI — Bento Box Grid (Merah · Putih · Slate)
- StoreLaporanRequest
- Proyek.php
- AuthenticatedLayout.jsx
- Public/Berita/Index.jsx
- AnalisisRisikoService
- app.jsx
- SinkronStatusProyek.php
- Cek.jsx
- KalkulasiAnggaranTest
- LaporanProgres
- 3. Navigasi Sidebar (`AuthenticatedLayout.jsx`)
- ChartCard.jsx
- RencanaRealisasi.jsx

## God Nodes (most connected - your core abstractions)
1. `@inertiajs/react` - 43 edges
2. `Proyek` - 40 edges
3. `lucide-react` - 40 edges
4. `KalkulasiAnggaranService` - 28 edges
5. `react` - 28 edges
6. `TransaksiPengeluaran` - 26 edges
7. `Anggaran` - 24 edges
8. `RabKomponen` - 24 edges
9. `User` - 24 edges
10. `1.3 Eloquent Model (8 berkas di `app/Models/`)` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Fase 2 — Autentikasi, RBAC, Audit Trail & Layout Bento` --references--> `Login()`  [INFERRED]
  PROGRESS.md → resources/js/Pages/Auth/Login.jsx
- `Test class and methods` --references--> `TestCase`  [INFERRED]
  .claude/skills/testing-best-practices/rules/naming.md → tests/TestCase.php
- `Names and structure` --references--> `TestCase`  [INFERRED]
  .claude/skills/testing-best-practices/rules/review.md → tests/TestCase.php
- `2.2 `BeritaPublikController` (`/berita`, `/berita/{slug}`)` --references--> `BeritaPublikController`  [INFERRED]
  FEATURE-PUBLIK-EXTRA.md → app/Http/Controllers/Publik/BeritaPublikController.php
- `2.2 Rute baru (`routes/web.php`, grup `role:pemdes`)` --references--> `AuthTest`  [INFERRED]
  FEATURE-PEMDES-EXTRA.md → tests/Feature/AuthTest.php

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **SIMBANGDES Hard Constraints** — claude_no_external_integration, claude_static_roles_public_access, claude_schema_compliance, claude_financial_precision, claude_readonly_audit_trail, claude_pdf_upload_security [EXTRACTED 1.00]
- **Role-Specific Chart Dashboards** — claude_dashboard_pemdes, claude_dashboard_pelaksana, claude_dashboard_admin, claude_dashboard_chart_requirement [EXTRACTED 1.00]
- **Atomic Budget Synchronization** — docs_business_rules_atomic_realisasi_calculation, docs_database_anggaran, docs_database_transaksi_pengeluaran, docs_architecture_kalkulasianggaranservice, docs_architecture_transaksipengeluaranobserver, docs_business_rules_validasi_batas_pagu [INFERRED 0.85]
- **Public Complaint Ticketing Flow** — docs_business_rules_kode_tiket_generator, docs_business_rules_status_pengaduan_flow, docs_business_rules_cek_status_tiket, docs_database_pengaduan_masyarakat, docs_architecture_tiketpengaduanservice, docs_architecture_public_form_protection [INFERRED 0.85]
- **Progress Report Submission & Verification Flow** — docs_business_rules_status_verifikasi_flow, docs_business_rules_kewajiban_foto, docs_business_rules_dampak_persetujuan, docs_business_rules_dampak_penolakan, docs_database_laporan_progres, docs_database_dokumentasi_foto, docs_prd_fr_06, docs_prd_fr_04 [INFERRED 0.85]

## Communities (135 total, 39 thin omitted)

### Community 0 - "PRD.md - Product Requirements Document"
Cohesion: 0.11
Nodes (16): ARCHITECTURE.md - System Architecture & Codebase Blueprint, CheckActiveUser Middleware, CheckRole Middleware, Project Folder Structure, Login Brute-Force Throttle (throttle:5,1), Route Groups (Public, Pemdes, Pelaksana, Admin), DATABASE.md - Database Design & Schema Specification, Entity Relationship Diagram (+8 more)

### Community 1 - "composer.json"
Cohesion: 0.22
Nodes (8): description, keywords, license, minimum-stability, name, prefer-stable, $schema, type

### Community 2 - "Table proyek"
Cohesion: 0.22
Nodes (14): Rejection Effects (catatan_revisi min 10 chars), Approval Effects (update progres_aktual, verified_by, auto-Selesai), Public Gallery Filter (only Disetujui reports), Pelaksana Project Data Isolation (pelaksana_id == auth()->id()), Mandatory Photo Documentation (Sebelum/Saat/Sesudah), status_proyek State Machine (Perencanaan, Berjalan, Terlambat, Selesai), status_verifikasi State Machine (Menunggu, Disetujui, Ditolak), Progress Value Validation (0-100, monotonic) (+6 more)

### Community 3 - "TransaksiPengeluaran"
Cohesion: 0.14
Nodes (8): AnggaranController, TransaksiRequest, TransaksiPengeluaran, 2.1 `KalkulasiAnggaranService` — tetap *single source of truth*, 2.2 Rute baru (`routes/web.php`, grup `role:pemdes`), 2.4 Form Request, 2. Arsitektur Backend, Log Sesi 9 — Fitur Pemdes Ekstra (2026-11-22)

### Community 4 - "dependencies"
Cohesion: 0.12
Nodes (6): react-chartjs-2@^5.3.1, react-chartjs-2, WARNA_ROLE, WARNA, WARNA_STATUS, WARNA_STATUS

### Community 5 - "Project Guidelines & UI Rules"
Cohesion: 0.11
Nodes (13): Graphify Skill Trigger (/graphify), Bento Box Grid Layout (mandatory), Identity Color Palette (red-600/700, white/slate-50, slate-800/900), Dashboard Admin (Activity/Login Trend, Users per Role), Mandatory Charts on Authenticated Dashboards (chart.js/recharts), Dashboard Pelaksana (Progres Fisik, Status Laporan), Dashboard Pemdes (Pagu vs Realisasi, Status Proyek), Documentation Map (docs/ PRD, TECH-STACK, DATABASE, ARCHITECTURE, BUSINESS-RULES) (+5 more)

### Community 6 - "Illuminate\Database\Schema\Blueprint"
Cohesion: 0.05
Nodes (20): {closure#1}(), {closure#2}(), {closure#1}(), {closure#2}(), {closure#1}(), {closure#2}(), {closure#3}(), {closure#1}() (+12 more)

### Community 7 - "Budget Sync & Audit Trail"
Cohesion: 0.24
Nodes (9): KalkulasiAnggaranService, Service & Observer Layer (Business Rules & Audit Trail), TransaksiPengeluaranObserver, High Absorption Warning (>= 85%), Persentase Serapan Formula, Validasi Batas Pagu (reject overspend), Table anggaran, Table transaksi_pengeluaran (+1 more)

### Community 8 - "Public Portal & Complaints"
Cohesion: 0.20
Nodes (10): Public Complaint Form Protection (CAPTCHA + throttle:3,1), TiketPengaduanService, BUSINESS-RULES.md - Domain Business Rules & Core Logic, Public Budget Transparency Aggregation, Ticket Status Lookup & Response Publication, Public Project Filter (is_public == 1, else 404), Ticket Code Generator (ADU-YYYY-XXXX), FR-07 Public Transparency Portal & Complaint Channel (+2 more)

### Community 9 - "Illuminate\Http\Request"
Cohesion: 0.12
Nodes (5): HandleInertiaRequests, {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}()

### Community 10 - "Composer Scripts"
Cohesion: 0.22
Nodes (9): scripts, dev, post-autoload-dump, post-create-project-cmd, post-root-package-install, post-update-cmd, pre-package-uninstall, setup (+1 more)

### Community 11 - "Composer Plugins"
Cohesion: 0.29
Nodes (7): pestphp/pest-plugin, php-http/discovery, config, allow-plugins, optimize-autoloader, preferred-install, sort-packages

### Community 12 - "Laravel Boost Setup"
Cohesion: 0.40
Nodes (6): Laravel Boost Bootstrap Guidelines, Laravel Boost Install (boost:install), PHP & Composer Prerequisites (php.new installer), Laravel Boost Bootstrap Guidelines (CLAUDE.md copy), Agentic Development with Laravel Boost, Laravel Framework Default README

### Community 13 - "PROGRESS — SIMBANGDES"
Cohesion: 0.17
Nodes (11): 0. Keputusan yang Sudah Dikunci (Sesi 0), 1. Temuan Validasi Silang (DATABASE × BUSINESS-RULES × ARCHITECTURE), 3. Daftar File Utama yang Dibuat/Diubah, K-1 — 4 Kolom Tambahan (Perbaikan Teknis #5 di `DATABASE.md`), K-2 — Ikuti Stack yang Sudah Terpasang, K-3 — Tabel ke-9 `berita_pengumuman` (Sesi 8, permintaan pemilik proyek), K-4 — Fitur Pemdes Ekstra (Sesi 9, permintaan pemilik proyek), Log Sesi 2 — Fase 2 (2026-11-21) (+3 more)

### Community 14 - "TestCase"
Cohesion: 0.33
Nodes (5): File layout, Grouping, Naming and structure, Naming tests, Test class and methods

### Community 20 - "PublikTest"
Cohesion: 0.08
Nodes (18): 0. Keputusan yang Perlu Dikunci (K-3), 1.1 Migration `2026_11_22_000001_create_berita_pengumuman_table.php`, 1.3 Form Request `app/Http/Requests/Pemdes/BeritaRequest.php`, 1.4 Controller `app/Http/Controllers/Pemdes/BeritaController.php`, 1.5 Rute (`routes/web.php`, di dalam grup `role:pemdes`), 1. Berita & Pengumuman — Skema & Backend, 3.1 `/statistik` — `Pages/Public/Statistik.jsx`, 3.2 `/berita` — `Pages/Public/Berita/Index.jsx` (+10 more)

### Community 27 - "Inertia\Testing\AssertableInertia"
Cohesion: 0.25
Nodes (12): {closure#1}(), {closure#10}(), {closure#11}(), {closure#12}(), {closure#13}(), {closure#3}(), {closure#4}(), {closure#5}() (+4 more)

### Community 28 - "Cloud CLI"
Cohesion: 0.06
Nodes (32): Adding a cache to an existing environment, Adding a database to an existing environment, Checklists for Multi-Step Operations, Custom domain setup, Full environment setup (app + database + cache + domain), New app from scratch, Sending email with Resend, Application Setup (+24 more)

### Community 29 - "Inertia React Development"
Cohesion: 0.09
Nodes (22): Basic Link Component, Basic Usage, Client-Side Navigation, Common Pitfalls, Deferred Props, Documentation, Form Component (Recommended), Form Component Reset Props (+14 more)

### Community 30 - "TECH_STACK.md - Technology Stack & UI Design System"
Cohesion: 0.17
Nodes (15): AuthenticatedLayout.jsx (role-based slate sidebar), HandleInertiaRequests (Shared Props auth.user, flash), Inertia.js Protocol (XHR / JSON Props), FR-02 Executive Dashboard & Role Statistics, TECH_STACK.md - Technology Stack & UI Design System, chart.js & react-chartjs-2 (or recharts), Brand Color Palette (Red, White, Slate) & Semantic Status Colors, Inertia.js v1.x (+7 more)

### Community 31 - "Process"
Cohesion: 0.17
Nodes (11): Edge cases, Glob mapping, Ground rules (read before you start), Infer conventions, Process, Step 0: Orient, Step 1: Predefined sweep, Step 2: Open-ended pass (+3 more)

### Community 32 - "Security best practices"
Cohesion: 0.18
Nodes (11): Apply cross-site request forgery protection, Audit dependencies, Authorize protected actions, Bind query parameters, Control mass assignment, Encrypt sensitive attributes when appropriate, Escape output in its context, Keep secrets out of application code (+3 more)

### Community 33 - "Audit Trail Immutability (no UPDATE/DELETE on log_aktivitas)"
Cohesion: 0.40
Nodes (4): AuditTrailObserver, Orphan File Cleanup (Storage::disk('public')->delete), Table log_aktivitas, Production Server Requirements (HTTPS, PHP extensions, storage:link)

### Community 34 - "Detection checklist"
Cohesion: 0.15
Nodes (11): A. Validation & HTTP input, B. Controllers & routing, C. Authorization, D. Eloquent & models, Detection checklist, E. Architecture & organization, F. Frontend & views, G. Database & migrations (+3 more)

### Community 35 - "Tailwind CSS development"
Cohesion: 0.18
Nodes (10): Basic usage, Common pitfalls, CSS-first configuration, Dark mode, Documentation, Import syntax, Replaced utilities, Spacing (+2 more)

### Community 36 - "Defense in Depth Security Architecture"
Cohesion: 0.22
Nodes (10): Dompdf SSRF Mitigation (isRemoteEnabled=false), File Upload Security (MIME, max:5120, Str::uuid names), ImageCompressionService, Photo Compression (80% quality, max 1600px), status_pengaduan Flow (Menunggu, Diproses, Selesai/Ditolak), FR-05 Complaint Follow-up & PDF Export, Non-Functional Requirements (NFR-01..NFR-12), barryvdh/laravel-dompdf (+2 more)

### Community 37 - "Advanced query best practices"
Cohesion: 0.20
Nodes (9): Advanced query best practices, Combine related counts with conditional aggregates, Compare `whereHas()` with an `IN` subquery, Consider a correlated subquery for has-many ordering, Create dynamic relationships with a subquery foreign key, Design composite indexes for the query, Measure two simple queries against one complex query, Reuse loaded parent models with `setRelation()` (+1 more)

### Community 38 - "Events and notifications best practices"
Cohesion: 0.20
Nodes (9): Cache event discovery during production deployment, Dispatch queued notifications after commit, Events and notifications best practices, Implement `HasLocalePreference` on notifiable models, Queue slow notifications, Rely on event discovery, Route notification channels to dedicated queues, Use on-demand notifications for non-user recipients (+1 more)

### Community 39 - "Queue and job best practices"
Cohesion: 0.20
Nodes (9): Back off transient failures, Batch jobs for group coordination, Configure time-based retry limits deliberately, Handle terminal failure when needed, Keep reservation time longer than execution time, Queue and job best practices, Rate limit external calls, Use Horizon for Redis queue operations (+1 more)

### Community 40 - "Illuminate\Database\Eloquent\Factories\Factory"
Cohesion: 0.22
Nodes (4): BeritaPengumumanFactory, RabKomponenFactory, 5. Pengujian (`php artisan make:test --phpunit PemdesExtraTest`), 1.2 Model `app/Models/BeritaPengumuman.php`

### Community 41 - "Brand Color Palette (Red, White, Slate) & Semantic Status Colors"
Cohesion: 0.33
Nodes (5): AnalisisRisikoService, Deviasi Progres Formula, Project Risk Classification (Aman / Waspada / Kritis), Target Berjalan (Expected Progress) Formula, FR-04 Progress Monitoring, Risk Detection & Report Verification

### Community 42 - "Caching best practices"
Cohesion: 0.22
Nodes (8): Caching best practices, Configure failover cache stores in production, Consider `Cache::flexible()` for stale-while-revalidate, Use `Cache::add()` for atomic conditional writes, Use `Cache::memo()` to avoid redundant hits within an execution, Use `Cache::remember()` for cache-aside reads, Use cache tags to invalidate related groups, Use `once()` for in-process memoization

### Community 43 - "Migration best practices"
Cohesion: 0.20
Nodes (9): Define foreign-key constraints deliberately, Design indexes for real queries, Generate migrations with Artisan, Keep migrations focused, Make rollbacks honest, Migration best practices, Mirror defaults only when unsaved models need them, Stage changes that affect existing rows (+1 more)

### Community 44 - "AppServiceProvider.php"
Cohesion: 0.22
Nodes (6): AppServiceProvider, 1.1 Migration `2026_11_22_000001_create_rab_komponen_table.php`, 1.2 Migration `2026_11_22_000002_add_rab_komponen_id_to_transaksi_pengeluaran_table.php`, 1.3 Migration `2026_11_22_000003_add_proyek_id_to_log_aktivitas_table.php`, 1.4 Model, 1. Penyesuaian Database (Backward-Compatible)

### Community 45 - "require"
Cohesion: 0.22
Nodes (9): require, barryvdh/laravel-dompdf, inertiajs/inertia-laravel, intervention/image, laravel/framework, laravel/tinker, mews/captcha, php (+1 more)

### Community 46 - "require-dev"
Cohesion: 0.22
Nodes (9): require-dev, fakerphp/faker, laravel/boost, laravel/pail, laravel/pao, laravel/pint, mockery/mockery, nunomaduro/collision (+1 more)

### Community 47 - "@inertiajs/react"
Cohesion: 0.07
Nodes (8): @inertiajs/react, JENIS, NAMA_ROLE, TAHAP, Index(), ModalTolak(), TAHAP, STATUS

### Community 48 - "Blade and view best practices"
Cohesion: 0.25
Nodes (7): Blade and view best practices, Prefer components for explicit interfaces, Return Blade fragments for partial rendering, Share compatible view data with a view composer, Share parent component props with `@aware`, Use `$attributes->merge()` in component templates, Use `@pushOnce` for per-component scripts

### Community 49 - "laravel-best-practices/SKILL.md"
Cohesion: 0.29
Nodes (5): Consistency first, Decision rules, How to apply, Laravel best practices, Rule index

### Community 50 - "Eloquent best practices"
Cohesion: 0.22
Nodes (8): Apply global scopes sparingly, Cast date and time attributes, Define attribute casts, Define precise relationship types, Eloquent best practices, Keep application queries model-aware, Use local scopes for reusable queries, Use `whereBelongsTo()` for relationship queries

### Community 51 - "Error handling best practices"
Cohesion: 0.25
Nodes (7): Add context to exception classes, Choose where to report and render exceptions, Define JSON rendering for API routes, Error handling best practices, Mark exceptions the handler should not report, Prevent duplicate reports of one exception instance, Throttle high-volume exception reports

### Community 52 - "Task scheduling best practices"
Cohesion: 0.25
Nodes (7): Bound work inside the task, Group shared configuration, Prevent unwanted overlap, Restrict tasks by environment, Run a task on one server, Run eligible commands in the background, Task scheduling best practices

### Community 53 - "Endpoint tests"
Cohesion: 0.25
Nodes (7): Endpoint coverage, Endpoint tests, How to write the test, Tenant isolation, Test authorization at the policy level, Testing validation, Which layer owns which case

### Community 55 - "Collection best practices"
Cohesion: 0.29
Nodes (6): Choose between `cursor()` and `lazy()`, Collection best practices, Use `#[CollectedBy]` for custom collection classes, Use higher-order messages for simple operations, Use `lazyById()` when updating records while iterating, Use `toQuery()` for bulk operations on collections

### Community 56 - "HTTP client best practices"
Cohesion: 0.29
Nodes (6): Fake HTTP requests in tests, Handle errors explicitly, HTTP client best practices, Pool independent requests, Retry only safe operations, Set explicit timeouts

### Community 57 - "Mail best practices"
Cohesion: 0.29
Nodes (6): Assert the delivery mode, Dispatch queued mail after commit, Mail best practices, Queue slow mail delivery, Separate content and delivery tests, Use Markdown mailables when they fit

### Community 58 - "Routing and controller best practices"
Cohesion: 0.29
Nodes (6): Keep controllers focused on HTTP concerns, Organize controllers around resources, Routing and controller best practices, Scope nested bindings, Use implicit route model binding, Use resource routes for resourceful actions

### Community 59 - "Validation and forms best practices"
Cohesion: 0.29
Nodes (6): Add cross-field validation after base rules, Express conditional rules clearly, Extract validation when it improves the boundary, Prefer readable rule syntax, Use only the validated data you intend, Validation and forms best practices

### Community 60 - "Assertions"
Cohesion: 0.29
Nodes (6): Arrange, act, assert, Assert a known value, Assert the complete result, Assertions, How to find the correct assertion, Named response assertions

### Community 61 - "testing-best-practices/SKILL.md"
Cohesion: 0.17
Nodes (8): Built-in Laravel assertion methods, How to find test framework features, Security tests, Consistency first, How to apply, Rule index, Testing best practices, What to test

### Community 62 - "Fakes, mocks, and determinism"
Cohesion: 0.33
Nodes (6): Database, Fakes, mocks, and determinism, How to isolate a dependency, Mocking, Outbound HTTP testing, Time and randomness

### Community 63 - "Configuration best practices"
Cohesion: 0.33
Nodes (5): Configuration best practices, Name repeated domain values, Protect production secrets, Read environment variables in configuration files, Use `App::environment()` for environment checks

### Community 64 - "Test suite performance"
Cohesion: 0.33
Nodes (5): Common errors, How to find a slow test, How to run the suite in parallel, Test environment, Test suite performance

### Community 65 - "Reviewing tests"
Cohesion: 0.33
Nodes (5): Assertions, Coverage, Names and structure, Reviewing tests, Test value

### Community 66 - "DatabaseSeeder"
Cohesion: 0.07
Nodes (23): TiketPengaduanService, Architecture best practices, Depend on contracts at boundaries, Extract focused business operations, Follow framework conventions, Inject required dependencies, Specify a deterministic sort order, Use atomic locks for race conditions (+15 more)

### Community 67 - "psr-4"
Cohesion: 0.40
Nodes (5): autoload, psr-4, App\\, Database\\Factories\\, Database\\Seeders\\

### Community 68 - "autoload-dev"
Cohesion: 0.67
Nodes (3): autoload-dev, psr-4, Tests\\

### Community 69 - "extra"
Cohesion: 0.67
Nodes (3): extra, laravel, dont-discover

### Community 71 - "devDependencies"
Cohesion: 0.11
Nodes (22): @vitejs/plugin-react@^6.3.0, devDependencies, concurrently@^10.0.3, laravel-vite-plugin@^3.1, tailwindcss@^4.0.0, @tailwindcss/vite@^4.0.0, vite@^8.0.0, optionalDependencies (+14 more)

### Community 74 - "index.js"
Cohesion: 0.18
Nodes (10): BentoGrid(), SPAN, VARIAN, aria(), controlClass(), FormCheckbox(), FormInput(), FormSelect() (+2 more)

### Community 75 - "Database performance best practices"
Cohesion: 0.18
Nodes (9): Add indexes for measured query patterns, Count relationships without loading them, Database performance best practices, Eager load relationships before iterating, Keep queries out of Blade templates, Prevent lazy loading in development, Process large data sets incrementally, Select only the columns you need (+1 more)

### Community 76 - "Inertia\Response"
Cohesion: 0.07
Nodes (12): DashboardPelaksanaController, ProyekTugasController, DashboardPemdesController, MonitoringController, PengaduanAdminController, RiwayatProyekController, BerandaController, BeritaPublikController (+4 more)

### Community 77 - "dependencies"
Cohesion: 0.13
Nodes (16): dependencies, chart.js@^4.6.1, @inertiajs/react@^2.3.29, leaflet@^1.9.4, lucide-react@^1.77.0, react@^19.3.1, react-leaflet@^5.0.0, chart.js (+8 more)

### Community 78 - "KalkulasiAnggaranService"
Cohesion: 0.11
Nodes (9): {closure#5}(), RabKomponenController, RabKomponenRequest, Anggaran, RabKomponen, {closure#1}(), {closure#2}(), {closure#6}() (+1 more)

### Community 79 - "2. Standar Desain Bento Box Grid Modern (Merah – Putih – Slate)"
Cohesion: 0.12
Nodes (16): 0. Temuan Audit (kondisi saat ini), 1.1 `resources/css/app.css`, 1.2 Komponen peta baru `resources/js/Components/PetaProyek.jsx`, 1. Perbaikan Bug Leaflet Maps (Wajib Tuntas), 2.1 Token & kanvas, 2.2 Grid, 2.3 Komponen kartu, 2.4 Aturan aksen merah (A-18) (+8 more)

### Community 80 - "DESIGN-SYSTEM — Perombakan Total Antarmuka SIMBANGDES"
Cohesion: 0.10
Nodes (19): 1.1 Proporsi warna 90–8–2, 1.2 Tipografi, 1.3 Ikonografi, 1.4 Kedalaman, sudut, spasi, 1.5 `resources/css/app.css` (target lengkap), 1. Fondasi Visual, 2.1 Grid, 2.2 Breakpoint & pengecekan wajib (+11 more)

### Community 81 - "Illuminate\Http\RedirectResponse"
Cohesion: 0.14
Nodes (5): BackupController, UserManagementController, LoginController, LogoutController, Fase 4 — Modul Pelaksana & Admin

### Community 82 - "App\Http\Controllers\Admin\UserManagementController"
Cohesion: 0.15
Nodes (4): Controller, ProfileController, StoreUserRequest, UpdateUserRequest

### Community 83 - "Illuminate\Foundation\Http\FormRequest"
Cohesion: 0.14
Nodes (5): TanggapiPengaduanRequest, TolakLaporanRequest, UpdateAnggaranRequest, StorePengaduanRequest, Log Sesi 6 — Audit Penutup QA, Security & Performance (2026-11-21)

### Community 86 - "Illuminate\Database\Eloquent\Model"
Cohesion: 0.16
Nodes (9): {closure#1}(), LogAktivitas, AuditTrailObserver, 0. Keputusan yang Perlu Dikunci (K-4), 1.5 Observer `AuditTrailObserver` — `proyek_id` + label informatif, 1.6 Uraian timeline yang mudah dibaca (tanpa kolom baru), 6. Urutan Kerja, Daftar file (+1 more)

### Community 89 - "lucide-react"
Cohesion: 0.06
Nodes (12): 6. Daftar File, lucide-react, react, GAYA, Lightbox(), FileDropzone(), formatUkuran(), FITUR (+4 more)

### Community 90 - "Convention and style best practices"
Cohesion: 0.29
Nodes (6): Convention and style best practices, Follow project naming conventions, Keep presentation code maintainable, Prefer clear, idiomatic syntax, Use utilities when they clarify intent, Write comments that explain why

### Community 93 - "3. Komponen UI (`resources/js/Components/UI/`)"
Cohesion: 0.12
Nodes (16): 3.10 `EmptyState`, 3.11 `ProgressBar` (dirombak), 3.13 Format angka (`Components/UI/format.js`, menggantikan isi `MoneyFormat.jsx`), 3.14 `Callout`, 3.15 `Toast` (rombak `FlashToast`), 3.16 `ChartFrame`, 3.1 `Button`, 3.2 `PageHeader` (+8 more)

### Community 94 - "Log Sesi 1 — Fase 1 (2026-11-21)"
Cohesion: 0.31
Nodes (3): PengaduanMasyarakat, UserFactory, Log Sesi 1 — Fase 1 (2026-11-21)

### Community 96 - "Modal.jsx"
Cohesion: 0.27
Nodes (12): 0. Diagnosis — Mengapa UI Terasa Kaku dan "AI Slop", 3.12 `Modal` & `useConfirm`, 7.1 Gelombang 1 — Fondasi, 7.2 Gelombang 2 — Portal Publik (`Pages/Public/`), 7.3 Gelombang 3 — Login, Profil, Panel Internal, 7. Peta Eksekusi 3 Gelombang, Log Sesi 13 — Perombakan UI Gelombang 3 (2026-11-22), ConfirmProvider() (+4 more)

### Community 98 - "Fase 3 — Modul Pemdes"
Cohesion: 0.27
Nodes (4): LaporanPdfController, StoreProyekRequest, UpdateProyekRequest, Fase 3 — Modul Pemdes

### Community 100 - "App\Http\Controllers\Publik\ProyekPublikController"
Cohesion: 0.14
Nodes (3): ProyekPublikController, 2. Checklist Tahapan Pengembangan, Fase 5 — Portal Publik & QA

### Community 102 - "Illuminate\Http\Request"
Cohesion: 0.15
Nodes (5): {closure#1}(), {closure#3}(), LaporanProgresController, VerifikasiLaporanController, ImageCompressionService

### Community 103 - "PublikTest.php"
Cohesion: 0.15
Nodes (9): {closure#1}(), {closure#10}(), {closure#11}(), {closure#3}(), {closure#4}(), {closure#5}(), {closure#7}(), {closure#8}() (+1 more)

### Community 105 - "PemdesTest.php"
Cohesion: 0.28
Nodes (4): {closure#1}(), {closure#2}(), {closure#3}(), TestCase

### Community 106 - "Log Sesi 11 — Perombakan UI Gelombang 1 (2026-11-22)"
Cohesion: 0.43
Nodes (6): Log Sesi 11 — Perombakan UI Gelombang 1 (2026-11-22), Button(), buttonClass(), IconButton(), UKURAN, VARIAN

### Community 107 - "PelaksanaAdminTest.php"
Cohesion: 0.22
Nodes (6): {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#5}(), {closure#7}()

### Community 108 - "PublicLayout.jsx"
Cohesion: 0.52
Nodes (6): aktifItem(), LinkSeluler(), MENU, PublicLayout(), semuaTautan, tujuan()

### Community 111 - "DataTable.jsx"
Cohesion: 0.67
Nodes (3): Aksi(), DataTable(), SEMBUNYI

### Community 112 - "PemdesExtraTest"
Cohesion: 0.18
Nodes (3): {closure#1}(), Proyek, PemdesExtraTest

### Community 113 - "KeuanganController.php"
Cohesion: 0.18
Nodes (3): {closure#1}(), {closure#6}(), KeuanganController

### Community 114 - "PemdesExtraTest.php"
Cohesion: 0.14
Nodes (7): {closure#1}(), {closure#11}(), {closure#5}(), {closure#6}(), {closure#7}(), {closure#8}(), {closure#9}()

### Community 117 - "App\Http\Controllers\Publik\StatistikController"
Cohesion: 0.15
Nodes (6): GaleriController, StatistikController, 2.1 `StatistikController` (`/statistik`), 2.2 `BeritaPublikController` (`/berita`, `/berita/{slug}`), 2.3 `GaleriController` (`/galeri`), 2. Query & Logika Halaman Publik

### Community 118 - "format.js"
Cohesion: 0.15
Nodes (9): Log Sesi 12 — Perombakan UI Gelombang 2 (2026-11-22), Log Sesi 14 — Diagnostic Sweep Pasca-Perombakan UI (2026-11-22), Log Sesi 4 — Fase 4 (Pelaksana & Admin), Log Sesi 7 — UI Polish Tahap A, B, C (2026-11-21), angka1, formatRupiah(), formatTanggal(), relatif (+1 more)

### Community 119 - ".setUp"
Cohesion: 0.22
Nodes (7): Framework fakes, Global fakes, Data and determinism, Data providers, Each test makes its own data, Factories and test data, Record construction

### Community 121 - "4. Rancangan UI — Bento Box Grid (Merah · Putih · Slate)"
Cohesion: 0.18
Nodes (12): 4.1 Keuangan → Anggaran (`Pages/Pemdes/Keuangan/Anggaran.jsx`), 4.2 Keuangan → Pengeluaran (`Pages/Pemdes/Keuangan/Pengeluaran.jsx`), 4.3 Keuangan → Rencana vs Realisasi (`Pages/Pemdes/Keuangan/RencanaRealisasi.jsx`), 4.4 Detail Proyek (`Pages/Pemdes/Proyek/Show.jsx`, rute `pemdes.proyek.show`), 4.5 Riwayat Proyek (`Pages/Pemdes/Riwayat/Index.jsx`) + `Components/TimelineRiwayat.jsx`, 4. Rancangan UI — Bento Box Grid (Merah · Putih · Slate), FormTransaksi(), kunciHari() (+4 more)

### Community 124 - "AuthenticatedLayout.jsx"
Cohesion: 0.43
Nodes (6): AuthenticatedLayout(), cocok(), jejak(), MENU, NAMA_ROLE, PROFIL

### Community 125 - "Public/Berita/Index.jsx"
Cohesion: 0.60
Nodes (4): ChipKategori(), Cover(), Index(), KATEGORI

### Community 127 - "app.jsx"
Cohesion: 0.33
Nodes (3): react-dom@^19.3.1, react-dom, pages

### Community 129 - "Cek.jsx"
Cohesion: 0.67
Nodes (3): Cek(), KETERANGAN, Tahapan()

### Community 132 - "3. Navigasi Sidebar (`AuthenticatedLayout.jsx`)"
Cohesion: 0.67
Nodes (3): 3.1 Struktur `MENU.pemdes` baru, 3.2 Render item ber-`children` (hanya cabang baru di `menu.map`, item datar tidak berubah), 3. Navigasi Sidebar (`AuthenticatedLayout.jsx`)

## Ambiguous Edges - Review These
- `Approval Effects (update progres_aktual, verified_by, auto-Selesai)` → `Table laporan_progres`  [AMBIGUOUS]
  docs/BUSINESS-RULES.md · relation: shares_data_with
- `Table proyek` → `Public Project Filter (is_public == 1, else 404)`  [AMBIGUOUS]
  docs/BUSINESS-RULES.md · relation: shares_data_with
- `Table proyek` → `Target Berjalan (Expected Progress) Formula`  [AMBIGUOUS]
  docs/BUSINESS-RULES.md · relation: shares_data_with
- `SDD Bab III.F Alignment (4 mandatory technical fixes)` → `FR-03 Project Management & Budget Allocation`  [AMBIGUOUS]
  docs/PRD.md · relation: conceptually_related_to

## Knowledge Gaps
- **24 isolated node(s):** `php`, `CheckRole Middleware`, `Entity Relationship Diagram`, `In-Scope Features`, `Product Goals & KPIs` (+19 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 674 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **39 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Fase 2 — Autentikasi, RBAC, Audit Trail & Layout Bento` connect `Database performance best practices` to `LaporanProgres`, `App\Http\Controllers\Publik\ProyekPublikController`, `TransaksiPengeluaran`, `Illuminate\Http\Request`, `PemdesExtraTest`, `App\Http\Controllers\Admin\UserManagementController`, `1.3 Eloquent Model (8 berkas di `app/Models/`)`, `lucide-react`, `Log Sesi 1 — Fase 1 (2026-11-21)`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **What connects `php`, `CheckRole Middleware`, `Entity Relationship Diagram` to the rest of the system?**
  _24 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PRD.md - Product Requirements Document` be split into smaller, more focused modules?**
  _Cohesion score 0.11428571428571428 - nodes in this community are weakly interconnected._
- **Why does `Login()` connect `lucide-react` to `Database performance best practices`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Should `TransaksiPengeluaran` be split into smaller, more focused modules?**
  _Cohesion score 0.1380952380952381 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Approval Effects (update progres_aktual, verified_by, auto-Selesai)` and `Table laporan_progres`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
- **What is the exact relationship between `Table proyek` and `Public Project Filter (is_public == 1, else 404)`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._