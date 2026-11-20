<?php

namespace App\Http\Controllers\Pelaksana;

use App\Http\Controllers\Controller;
use App\Models\Proyek;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProyekTugasController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Pelaksana/Proyek/Index', [
            'proyek' => $request->user()->proyekDitugaskan()->with('anggaran:proyek_id,pagu_anggaran')->orderBy('nama_proyek')->get(),
        ]);
    }

    public function show(Request $request, Proyek $proyek): Response
    {
        abort_unless($proyek->pelaksana_id === $request->user()->id, 404);

        return Inertia::render('Pelaksana/Proyek/Show', [
            'proyek' => $proyek->load('anggaran:proyek_id,pagu_anggaran,total_realisasi,sisa_anggaran'),
            'laporan' => $proyek->laporanProgres()->with('foto')->latest()->get(),
            'bisaLapor' => $proyek->status_proyek !== 'Selesai' && ! $proyek->laporanProgres()->where('status_verifikasi', 'Menunggu')->exists(),
        ]);
    }
}
