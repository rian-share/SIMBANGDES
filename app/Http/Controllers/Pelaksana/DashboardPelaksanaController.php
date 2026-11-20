<?php

namespace App\Http\Controllers\Pelaksana;

use App\Http\Controllers\Controller;
use App\Models\LaporanProgres;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardPelaksanaController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $proyek = $user->proyekDitugaskan()->orderBy('nama_proyek')->get(['id', 'nama_proyek', 'status_proyek', 'progres_aktual', 'target_progres', 'tanggal_selesai']);
        $status = $user->laporanDikirim()->selectRaw('status_verifikasi, COUNT(*) AS jumlah')->groupBy('status_verifikasi')->pluck('jumlah', 'status_verifikasi');

        return Inertia::render('Pelaksana/Dashboard', [
            'proyek' => $proyek,
            'statusLaporan' => collect(['Menunggu', 'Disetujui', 'Ditolak'])->map(fn ($s) => ['status' => $s, 'jumlah' => (int) ($status[$s] ?? 0)]),
            'perluRevisi' => LaporanProgres::with('proyek:id,nama_proyek')->where('pelaksana_id', $user->id)
                ->where('status_verifikasi', 'Ditolak')->latest()->limit(5)->get(),
        ]);
    }
}
