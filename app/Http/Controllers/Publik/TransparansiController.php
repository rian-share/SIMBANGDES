<?php

namespace App\Http\Controllers\Publik;

use App\Http\Controllers\Controller;
use App\Models\Anggaran;
use Inertia\Inertia;
use Inertia\Response;

class TransparansiController extends Controller
{
    public function __invoke(): Response
    {
        $rincian = Anggaran::whereHas('proyek', fn ($q) => $q->publik())->with('proyek:id,nama_proyek')
            ->orderByDesc('pagu_anggaran')
            ->get(['id', 'proyek_id', 'tahun_anggaran', 'sumber_dana', 'pagu_anggaran', 'total_realisasi', 'sisa_anggaran'])
            ->each->append('persentase_serapan');

        return Inertia::render('Public/Transparansi', [
            'total' => [
                'pagu' => $rincian->sum('pagu_anggaran'),
                'realisasi' => $rincian->sum('total_realisasi'),
                'sisa' => $rincian->sum('sisa_anggaran'),
            ],
            'rincian' => $rincian,
        ]);
    }
}
