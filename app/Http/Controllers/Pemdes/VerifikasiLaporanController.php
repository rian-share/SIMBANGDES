<?php

namespace App\Http\Controllers\Pemdes;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pemdes\TolakLaporanRequest;
use App\Models\LaporanProgres;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class VerifikasiLaporanController extends Controller
{
    public function index(Request $request): Response
    {
        $laporan = LaporanProgres::with('proyek:id,nama_proyek,progres_aktual,target_progres', 'pelaksana:id,nama_lengkap', 'foto')
            ->when($request->query('status'), fn ($q, $s) => $q->where('status_verifikasi', $s))
            ->orderByRaw("status_verifikasi = 'Menunggu' DESC")->latest()
            ->paginate(10)->withQueryString();

        return Inertia::render('Pemdes/Laporan/Index', ['laporan' => $laporan, 'filter' => $request->only('status')]);
    }

    public function approve(Request $request, LaporanProgres $laporan): RedirectResponse
    {
        DB::transaction(function () use ($request, $laporan) {
            $laporan = LaporanProgres::whereKey($laporan->id)->lockForUpdate()->firstOrFail();
            abort_unless($laporan->status_verifikasi === 'Menunggu', 422, 'Laporan sudah diverifikasi.');

            $laporan->forceFill([
                'status_verifikasi' => 'Disetujui',
                'verified_by' => $request->user()->id,
                'verified_at' => now(),
                'catatan_revisi' => null,
            ])->save();

            $proyek = $laporan->proyek;
            $proyek->progres_aktual = $laporan->persentase_fisik;
            if ((float) $laporan->persentase_fisik >= (float) $proyek->target_progres) {
                $proyek->status_proyek = 'Selesai';
            } elseif ($proyek->status_proyek === 'Perencanaan') {
                $proyek->status_proyek = 'Berjalan';
            }
            $proyek->save();
        });

        return back()->with('success', 'Laporan disetujui dan progres proyek diperbarui.');
    }

    public function reject(TolakLaporanRequest $request, LaporanProgres $laporan): RedirectResponse
    {
        abort_unless($laporan->status_verifikasi === 'Menunggu', 422, 'Laporan sudah diverifikasi.');

        $laporan->forceFill([
            'status_verifikasi' => 'Ditolak',
            'catatan_revisi' => $request->validated('catatan_revisi'),
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ])->save();

        return back()->with('success', 'Laporan dikembalikan ke pelaksana.');
    }
}
