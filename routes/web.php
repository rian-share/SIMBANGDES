<?php

use App\Http\Controllers\Admin\AuditTrailController;
use App\Http\Controllers\Admin\BackupController;
use App\Http\Controllers\Admin\DashboardAdminController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Pelaksana\DashboardPelaksanaController;
use App\Http\Controllers\Pelaksana\LaporanProgresController;
use App\Http\Controllers\Pelaksana\ProyekTugasController;
use App\Http\Controllers\Pemdes\AnggaranController;
use App\Http\Controllers\Pemdes\BeritaController;
use App\Http\Controllers\Pemdes\DashboardPemdesController;
use App\Http\Controllers\Pemdes\KeuanganController;
use App\Http\Controllers\Pemdes\LaporanPdfController;
use App\Http\Controllers\Pemdes\MonitoringController;
use App\Http\Controllers\Pemdes\PengaduanAdminController;
use App\Http\Controllers\Pemdes\ProyekController;
use App\Http\Controllers\Pemdes\RabKomponenController;
use App\Http\Controllers\Pemdes\RiwayatProyekController;
use App\Http\Controllers\Pemdes\VerifikasiLaporanController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Publik\BerandaController;
use App\Http\Controllers\Publik\BeritaPublikController;
use App\Http\Controllers\Publik\GaleriController;
use App\Http\Controllers\Publik\PengaduanPublikController;
use App\Http\Controllers\Publik\PetaController;
use App\Http\Controllers\Publik\ProyekPublikController;
use App\Http\Controllers\Publik\StatistikController;
use App\Http\Controllers\Publik\TransparansiController;
use Illuminate\Support\Facades\Route;

// Grup publik (tanpa login); hanya proyek is_public = true (BR-PUB).
Route::get('/', BerandaController::class)->name('beranda');
Route::get('/proyek', [ProyekPublikController::class, 'index'])->name('proyek.publik');
Route::get('/proyek/{proyek}', [ProyekPublikController::class, 'show'])->name('proyek.publik.show');
Route::get('/peta', PetaController::class)->name('peta');
Route::get('/transparansi', TransparansiController::class)->name('transparansi');
Route::get('/statistik', StatistikController::class)->name('statistik');
Route::get('/berita', [BeritaPublikController::class, 'index'])->name('berita.index');
Route::get('/berita/{berita:slug}', [BeritaPublikController::class, 'show'])->name('berita.show');
Route::get('/galeri', GaleriController::class)->name('galeri');
Route::get('/pengaduan', [PengaduanPublikController::class, 'create'])->name('pengaduan.create');
Route::post('/pengaduan', [PengaduanPublikController::class, 'store'])->middleware('throttle:3,1')->name('pengaduan.store');
Route::get('/pengaduan/cek', [PengaduanPublikController::class, 'cek'])->middleware('throttle:20,1')->name('pengaduan.cek');

Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->middleware('throttle:5,1');
});

Route::middleware(['auth', 'active'])->group(function () {
    Route::post('/logout', LogoutController::class)->name('logout');
    Route::get('/profil', [ProfileController::class, 'edit'])->name('profil.edit');
    Route::patch('/profil', [ProfileController::class, 'update'])->name('profil.update');
});

Route::middleware(['auth', 'active', 'role:pemdes'])->prefix('pemdes')->name('pemdes.')->group(function () {
    Route::get('/dashboard', DashboardPemdesController::class)->name('dashboard');
    Route::resource('proyek', ProyekController::class);
    Route::get('keuangan/anggaran', [KeuanganController::class, 'anggaran'])->name('keuangan.anggaran');
    Route::get('keuangan/pengeluaran', [KeuanganController::class, 'pengeluaran'])->name('keuangan.pengeluaran');
    Route::get('keuangan/rencana-realisasi', [KeuanganController::class, 'rencanaRealisasi'])->name('keuangan.rencana-realisasi');
    Route::post('proyek/{proyek}/komponen', [RabKomponenController::class, 'store'])->name('komponen.store');
    Route::patch('komponen/{komponen}', [RabKomponenController::class, 'update'])->name('komponen.update');
    Route::delete('komponen/{komponen}', [RabKomponenController::class, 'destroy'])->name('komponen.destroy');
    Route::get('riwayat-proyek', RiwayatProyekController::class)->name('riwayat.index');
    Route::get('proyek/{proyek}/anggaran', [AnggaranController::class, 'show'])->name('anggaran.show');
    Route::patch('proyek/{proyek}/anggaran', [AnggaranController::class, 'update'])->name('anggaran.update');
    Route::post('proyek/{proyek}/transaksi', [AnggaranController::class, 'storeTransaksi'])->name('transaksi.store');
    Route::post('transaksi/{transaksi}', [AnggaranController::class, 'updateTransaksi'])->name('transaksi.update');
    Route::delete('transaksi/{transaksi}', [AnggaranController::class, 'destroyTransaksi'])->name('transaksi.destroy');
    Route::get('monitoring', MonitoringController::class)->name('monitoring');
    Route::get('laporan', [VerifikasiLaporanController::class, 'index'])->name('laporan.index');
    Route::post('laporan/{laporan}/setujui', [VerifikasiLaporanController::class, 'approve'])->name('laporan.approve');
    Route::post('laporan/{laporan}/tolak', [VerifikasiLaporanController::class, 'reject'])->name('laporan.reject');
    Route::get('pengaduan', [PengaduanAdminController::class, 'index'])->name('pengaduan.index');
    Route::get('pengaduan/{pengaduan}', [PengaduanAdminController::class, 'show'])->name('pengaduan.show');
    Route::patch('pengaduan/{pengaduan}', [PengaduanAdminController::class, 'update'])->name('pengaduan.update');
    Route::get('rekap-pdf', LaporanPdfController::class)->name('rekap.pdf');
    // Unggah berkas via Inertia wajib POST, jadi update tidak memakai PUT (pola transaksi.update).
    Route::resource('berita', BeritaController::class)->except(['show', 'update'])->parameters(['berita' => 'berita']);
    Route::post('berita/{berita}', [BeritaController::class, 'update'])->name('berita.update');
});

Route::middleware(['auth', 'active', 'role:pelaksana'])->prefix('pelaksana')->name('pelaksana.')->group(function () {
    Route::get('/dashboard', DashboardPelaksanaController::class)->name('dashboard');
    Route::get('proyek', [ProyekTugasController::class, 'index'])->name('proyek.index');
    Route::get('proyek/{proyek}', [ProyekTugasController::class, 'show'])->name('proyek.show');
    Route::get('proyek/{proyek}/laporan/create', [LaporanProgresController::class, 'create'])->name('laporan.create');
    Route::post('proyek/{proyek}/laporan', [LaporanProgresController::class, 'store'])->name('laporan.store');
    Route::get('laporan', [LaporanProgresController::class, 'index'])->name('laporan.index');
    Route::get('laporan/{laporan}/edit', [LaporanProgresController::class, 'edit'])->name('laporan.edit');
    Route::post('laporan/{laporan}', [LaporanProgresController::class, 'update'])->name('laporan.update');
});

Route::middleware(['auth', 'active', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', DashboardAdminController::class)->name('dashboard');
    Route::resource('users', UserManagementController::class)->except(['show', 'destroy']);
    Route::patch('users/{user}/status', [UserManagementController::class, 'toggleStatus'])->name('users.status');
    Route::post('users/{user}/reset-password', [UserManagementController::class, 'resetPassword'])->name('users.reset-password');
    Route::get('audit', [AuditTrailController::class, 'index'])->name('audit.index');
    Route::get('backup', [BackupController::class, 'index'])->name('backup.index');
    Route::post('backup', [BackupController::class, 'store'])->name('backup.store');
    Route::get('backup/{berkas}', [BackupController::class, 'download'])->name('backup.download');
});
