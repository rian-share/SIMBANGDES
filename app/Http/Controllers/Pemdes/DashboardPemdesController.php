<?php

namespace App\Http\Controllers\Pemdes;

use App\Http\Controllers\Controller;
use App\Models\Anggaran;
use App\Models\LaporanProgres;
use App\Models\Proyek;
use App\Services\AnalisisRisikoService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardPemdesController extends Controller
{
    public function __invoke(AnalisisRisikoService $risiko): Response
    {
        $status = Proyek::selectRaw('status_proyek, COUNT(*) AS jumlah')->groupBy('status_proyek')->pluck('jumlah', 'status_proyek');
        $total = Anggaran::selectRaw('COALESCE(SUM(pagu_anggaran),0) AS pagu, COALESCE(SUM(total_realisasi),0) AS realisasi, COALESCE(SUM(sisa_anggaran),0) AS sisa')->first();

        $berisiko = Proyek::with('pelaksana:id,nama_lengkap')
            ->whereIn('status_proyek', ['Berjalan', 'Terlambat'])
            ->get()
            ->map(fn (Proyek $p) => [
                'id' => $p->id,
                'nama_proyek' => $p->nama_proyek,
                'pelaksana' => $p->pelaksana->nama_lengkap,
                'deviasi' => $risiko->deviasi($p),
                'risiko' => $risiko->levelRisiko($p),
            ])
            ->where('risiko', '!=', 'Aman')
            ->sortBy('deviasi')
            ->take(5)
            ->values();

        return Inertia::render('Pemdes/Dashboard', [
            'kpi' => [
                'total' => $status->sum(),
                'berjalan' => (int) ($status['Berjalan'] ?? 0),
                'selesai' => (int) ($status['Selesai'] ?? 0),
                'terlambat' => (int) ($status['Terlambat'] ?? 0),
                'pagu' => $total->pagu,
                'realisasi' => $total->realisasi,
                'sisa' => $total->sisa,
            ],
            'statusProyek' => collect(['Perencanaan', 'Berjalan', 'Selesai', 'Terlambat'])
                ->map(fn ($s) => ['status' => $s, 'jumlah' => (int) ($status[$s] ?? 0)]),
            'anggaranPerProyek' => Anggaran::with('proyek:id,nama_proyek')->orderByDesc('pagu_anggaran')->limit(10)->get()
                ->map(fn (Anggaran $a) => [
                    'nama' => $a->proyek->nama_proyek,
                    'pagu' => $a->pagu_anggaran,
                    'realisasi' => $a->total_realisasi,
                ]),
            'laporanMenunggu' => LaporanProgres::with('proyek:id,nama_proyek', 'pelaksana:id,nama_lengkap')
                ->where('status_verifikasi', 'Menunggu')->latest()->limit(5)->get(),
            'proyekBerisiko' => $berisiko,
        ]);
    }
}
