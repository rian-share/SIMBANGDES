<?php

namespace App\Http\Controllers\Publik;

use App\Http\Controllers\Controller;
use App\Models\Anggaran;
use App\Models\PengaduanMasyarakat;
use App\Models\Proyek;
use Inertia\Inertia;
use Inertia\Response;

class StatistikController extends Controller
{
    /** Seluruh agregasi dihitung di SQL dan hanya dari proyek publik (BR-PUB). */
    public function __invoke(): Response
    {
        $proyekPublik = fn ($q) => $q->publik();

        $ringkasan = Proyek::publik()
            ->selectRaw('COUNT(*) as jumlah_proyek, COALESCE(ROUND(AVG(progres_aktual), 2), 0) as rata_progres')->first();
        $uang = Anggaran::whereHas('proyek', $proyekPublik)
            ->selectRaw('COALESCE(SUM(pagu_anggaran),0) as pagu, COALESCE(SUM(total_realisasi),0) as realisasi')->first();

        $kategori = Proyek::publik()
            ->selectRaw("COALESCE(kategori, 'Lainnya') as label, COUNT(*) as jumlah")
            ->groupBy('kategori')->orderByDesc('jumlah')->get();

        $tren = Anggaran::whereHas('proyek', $proyekPublik)
            ->selectRaw('tahun_anggaran, COUNT(*) as jumlah_proyek, SUM(pagu_anggaran) as pagu, SUM(total_realisasi) as realisasi,
                COALESCE(ROUND(SUM(total_realisasi) / NULLIF(SUM(pagu_anggaran), 0) * 100, 2), 0) as persen_serapan')
            ->groupBy('tahun_anggaran')->orderBy('tahun_anggaran')->get();

        $status = collect(['Perencanaan', 'Berjalan', 'Terlambat', 'Selesai'])->mapWithKeys(fn ($s) => [$s => 0])
            ->merge(Proyek::publik()->selectRaw('status_proyek, COUNT(*) as jumlah')->groupBy('status_proyek')->pluck('jumlah', 'status_proyek'));

        // Pengaduan umum (tanpa proyek) atau terkait proyek publik; hanya angka agregat yang keluar (V-17).
        $aduan = collect(['Menunggu', 'Diproses', 'Selesai', 'Ditolak'])->mapWithKeys(fn ($s) => [$s => 0])
            ->merge(PengaduanMasyarakat::where(fn ($q) => $q->whereNull('proyek_id')->orWhereHas('proyek', $proyekPublik))
                ->selectRaw('status_pengaduan, COUNT(*) as jumlah')->groupBy('status_pengaduan')->pluck('jumlah', 'status_pengaduan'));
        $totalAduan = $aduan->sum();

        return Inertia::render('Public/Statistik', [
            'ringkasan' => $ringkasan->only('jumlah_proyek', 'rata_progres'),
            'uang' => $uang->only('pagu', 'realisasi'),
            'kategori' => $kategori,
            'tren' => $tren,
            'status' => $status,
            'pengaduan' => [
                'rincian' => $aduan,
                'total' => $totalAduan,
                'tingkat_selesai' => $totalAduan > 0 ? round($aduan['Selesai'] / $totalAduan * 100, 1) : 0,
            ],
        ]);
    }
}
