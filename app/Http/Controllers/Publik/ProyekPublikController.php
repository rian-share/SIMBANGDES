<?php

namespace App\Http\Controllers\Publik;

use App\Http\Controllers\Controller;
use App\Models\Anggaran;
use App\Models\DokumentasiFoto;
use App\Models\Proyek;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProyekPublikController extends Controller
{
    public function index(Request $request): Response
    {
        $filter = $request->only('q', 'status', 'kategori', 'tahun');

        $proyek = Proyek::publik()->with('anggaran:proyek_id,tahun_anggaran,pagu_anggaran,total_realisasi')
            ->when($filter['q'] ?? null, fn ($q, $v) => $q->where(fn ($w) => $w->where('nama_proyek', 'like', "%{$v}%")->orWhere('lokasi', 'like', "%{$v}%")))
            ->when($filter['status'] ?? null, fn ($q, $v) => $q->where('status_proyek', $v))
            ->when($filter['kategori'] ?? null, fn ($q, $v) => $q->where('kategori', $v))
            ->when($filter['tahun'] ?? null, fn ($q, $v) => $q->whereHas('anggaran', fn ($a) => $a->where('tahun_anggaran', $v)))
            ->latest()->paginate(9)->withQueryString();

        return Inertia::render('Public/Proyek/Index', [
            'proyek' => $proyek,
            'filter' => $filter,
            'opsi' => [
                'kategori' => Proyek::publik()->whereNotNull('kategori')->distinct()->orderBy('kategori')->pluck('kategori'),
                'tahun' => Anggaran::whereHas('proyek', fn ($q) => $q->publik())->distinct()->orderByDesc('tahun_anggaran')->pluck('tahun_anggaran'),
            ],
        ]);
    }

    public function show(Proyek $proyek): Response
    {
        abort_unless($proyek->is_public, 404);

        $proyek->load('anggaran:proyek_id,tahun_anggaran,sumber_dana,pagu_anggaran,total_realisasi,sisa_anggaran');
        $disetujui = fn ($q) => $q->where('status_verifikasi', 'Disetujui');

        return Inertia::render('Public/Proyek/Show', [
            'proyek' => $proyek->only('id', 'nama_proyek', 'kategori', 'lokasi', 'deskripsi', 'status_proyek', 'progres_aktual', 'target_progres', 'tanggal_mulai', 'tanggal_selesai') + ['anggaran' => $proyek->anggaran],
            'riwayat' => $proyek->laporanProgres()->where($disetujui)->latest('tanggal_laporan')
                ->get(['id', 'tanggal_laporan', 'persentase_fisik', 'keterangan']),
            'galeri' => DokumentasiFoto::where('proyek_id', $proyek->id)->whereHas('laporan', $disetujui)
                ->latest('created_at')->get(['id', 'tahap', 'file_path'])->groupBy('tahap'),
        ]);
    }
}
