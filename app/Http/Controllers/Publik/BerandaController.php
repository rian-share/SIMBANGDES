<?php

namespace App\Http\Controllers\Publik;

use App\Http\Controllers\Controller;
use App\Models\Anggaran;
use App\Models\BeritaPengumuman;
use App\Models\Proyek;
use Inertia\Inertia;
use Inertia\Response;

class BerandaController extends Controller
{
    public function __invoke(): Response
    {
        $status = Proyek::publik()->selectRaw('status_proyek, COUNT(*) as jumlah')->groupBy('status_proyek')->pluck('jumlah', 'status_proyek');
        $anggaran = Anggaran::whereHas('proyek', fn ($q) => $q->publik())
            ->selectRaw('COALESCE(SUM(pagu_anggaran),0) as pagu, COALESCE(SUM(total_realisasi),0) as realisasi, COALESCE(SUM(sisa_anggaran),0) as sisa')
            ->first();

        return Inertia::render('Public/Home', [
            'statistik' => [
                'total' => $status->sum(),
                'berjalan' => $status['Berjalan'] ?? 0,
                'selesai' => $status['Selesai'] ?? 0,
                'terlambat' => $status['Terlambat'] ?? 0,
            ],
            'anggaran' => $anggaran->only('pagu', 'realisasi', 'sisa'),
            'berita' => BeritaPengumuman::terbit()->latest('published_at')->limit(3)
                ->get(['id', 'judul', 'slug', 'kategori', 'gambar_cover', 'published_at']),
            'terbaru' => Proyek::publik()->with('anggaran:proyek_id,pagu_anggaran,total_realisasi')
                ->latest()->limit(3)->get(['id', 'nama_proyek', 'kategori', 'lokasi', 'status_proyek', 'progres_aktual']),
        ]);
    }
}
