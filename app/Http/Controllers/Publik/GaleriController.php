<?php

namespace App\Http\Controllers\Publik;

use App\Http\Controllers\Controller;
use App\Models\Anggaran;
use App\Models\DokumentasiFoto;
use App\Models\Proyek;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class GaleriController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $filter = $request->validate([
            'proyek' => ['nullable', 'integer'],
            'tahap' => ['nullable', Rule::in(['Sebelum', 'Saat', 'Sesudah'])],
            'tahun' => ['nullable', 'integer', 'between:2000,2100'],
        ]);

        $disetujui = fn ($q) => $q->where('status_verifikasi', 'Disetujui'); // BR-PUB 2
        $publik = fn ($q) => $q->publik(); // BR-PUB 1

        $foto = DokumentasiFoto::query()
            ->whereHas('laporan', $disetujui)
            ->whereHas('proyek', $publik)
            ->with(['proyek:id,nama_proyek', 'proyek.anggaran:id,proyek_id,tahun_anggaran'])
            ->when($filter['proyek'] ?? null, fn ($q, $v) => $q->where('proyek_id', $v))
            ->when($filter['tahap'] ?? null, fn ($q, $v) => $q->where('tahap', $v))
            ->when($filter['tahun'] ?? null, fn ($q, $v) => $q->whereHas('proyek.anggaran', fn ($a) => $a->where('tahun_anggaran', $v)))
            ->latest('created_at')->latest('id')
            ->paginate(24, ['id', 'proyek_id', 'tahap', 'file_path', 'created_at'])
            ->withQueryString()
            ->through(fn ($f) => [
                'id' => $f->id,
                'tahap' => $f->tahap,
                'file_path' => $f->file_path,
                'created_at' => $f->created_at,
                'proyek' => ['id' => $f->proyek->id, 'nama' => $f->proyek->nama_proyek],
                'tahun' => $f->proyek->anggaran?->tahun_anggaran,
            ]);

        $tahap = collect(['Sebelum', 'Saat', 'Sesudah'])->mapWithKeys(fn ($t) => [$t => 0])
            ->merge(DokumentasiFoto::whereHas('laporan', $disetujui)->whereHas('proyek', $publik)
                ->selectRaw('tahap, COUNT(*) as jumlah')->groupBy('tahap')->pluck('jumlah', 'tahap'));

        return Inertia::render('Public/Galeri', [
            'foto' => $foto,
            'filter' => $filter,
            'perTahap' => $tahap,
            'opsi' => [
                'proyek' => Proyek::publik()->whereHas('dokumentasiFoto', fn ($q) => $q->whereHas('laporan', $disetujui))
                    ->orderBy('nama_proyek')->get(['id', 'nama_proyek']),
                'tahun' => Anggaran::whereHas('proyek', $publik)->distinct()->orderByDesc('tahun_anggaran')->pluck('tahun_anggaran'),
            ],
        ]);
    }
}
