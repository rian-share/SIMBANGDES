<?php

namespace App\Http\Controllers\Pemdes;

use App\Http\Controllers\Controller;
use App\Models\Proyek;
use App\Services\AnalisisRisikoService;
use Inertia\Inertia;
use Inertia\Response;

class MonitoringController extends Controller
{
    public function __invoke(AnalisisRisikoService $risiko): Response
    {
        $proyek = Proyek::with('pelaksana:id,nama_lengkap')->orderBy('tanggal_selesai')->get()
            ->map(fn (Proyek $p) => [
                'id' => $p->id,
                'nama_proyek' => $p->nama_proyek,
                'pelaksana' => $p->pelaksana->nama_lengkap,
                'status_proyek' => $p->status_proyek,
                'tanggal_selesai' => $p->tanggal_selesai->toDateString(),
                'progres_aktual' => $p->progres_aktual,
                'target_berjalan' => $risiko->targetBerjalan($p),
                'deviasi' => $risiko->deviasi($p),
                'risiko' => $risiko->levelRisiko($p),
            ]);

        return Inertia::render('Pemdes/Monitoring/Index', ['proyek' => $proyek]);
    }
}
