<?php

namespace App\Http\Controllers\Pelaksana;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pelaksana\StoreLaporanRequest;
use App\Http\Requests\Pelaksana\UpdateLaporanRequest;
use App\Models\LaporanProgres;
use App\Models\Proyek;
use App\Services\ImageCompressionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LaporanProgresController extends Controller
{
    public function __construct(private ImageCompressionService $gambar) {}

    public function index(Request $request): Response
    {
        return Inertia::render('Pelaksana/Laporan/Index', [
            'laporan' => $request->user()->laporanDikirim()->with('proyek:id,nama_proyek')->latest()->paginate(10),
        ]);
    }

    public function create(Request $request, Proyek $proyek): Response
    {
        $this->milikSendiri($request, $proyek);

        return Inertia::render('Pelaksana/Laporan/Form', ['proyek' => $proyek->only('id', 'nama_proyek', 'progres_aktual')]);
    }

    public function store(StoreLaporanRequest $request, Proyek $proyek): RedirectResponse
    {
        $this->milikSendiri($request, $proyek);

        $disimpan = [];
        try {
            DB::transaction(function () use ($request, $proyek, &$disimpan) {
                Proyek::whereKey($proyek->id)->lockForUpdate()->firstOrFail();

                // V-10: maksimal 1 laporan Menunggu per proyek.
                if ($proyek->status_proyek === 'Selesai' || $proyek->laporanProgres()->where('status_verifikasi', 'Menunggu')->exists()) {
                    throw ValidationException::withMessages(['persentase_fisik' => 'Proyek sudah selesai atau masih ada laporan yang menunggu verifikasi.']);
                }

                $laporan = LaporanProgres::create($request->safe()->only('persentase_fisik', 'keterangan', 'kendala') + [
                    'proyek_id' => $proyek->id,
                    'pelaksana_id' => $request->user()->id,
                    'tanggal_laporan' => today(),
                ]);

                $this->simpanFoto($request->file('foto', []), $laporan, $disimpan);
            });
        } catch (\Throwable $e) {
            Storage::disk('public')->delete($disimpan);
            throw $e;
        }

        return redirect()->route('pelaksana.proyek.show', $proyek)->with('success', 'Laporan terkirim, menunggu verifikasi Pemdes.');
    }

    public function edit(Request $request, LaporanProgres $laporan): Response
    {
        $this->bisaDirevisi($request, $laporan);

        return Inertia::render('Pelaksana/Laporan/Form', [
            'proyek' => $laporan->proyek->only('id', 'nama_proyek', 'progres_aktual'),
            'laporan' => $laporan->load('foto'),
        ]);
    }

    public function update(UpdateLaporanRequest $request, LaporanProgres $laporan): RedirectResponse
    {
        $this->bisaDirevisi($request, $laporan);

        $baru = $request->file('foto', []);
        $hapus = $laporan->foto()->where(fn ($q) => $q->whereIn('id', $request->input('hapus_foto', []))->orWhereIn('tahap', array_keys($baru)))->get();

        if ($laporan->foto()->count() - $hapus->count() + count($baru) < 1) {
            throw ValidationException::withMessages(['foto' => 'Laporan harus memiliki minimal 1 foto dokumentasi.']);
        }

        $disimpan = [];
        try {
            DB::transaction(function () use ($request, $laporan, $baru, $hapus, &$disimpan) {
                $laporan->fill($request->safe()->only('persentase_fisik', 'keterangan', 'kendala'));
                $laporan->status_verifikasi = 'Menunggu'; // catatan_revisi dipertahankan sebagai riwayat
                $laporan->save();

                $hapus->each->delete();
                $this->simpanFoto($baru, $laporan, $disimpan);
            });
        } catch (\Throwable $e) {
            Storage::disk('public')->delete($disimpan);
            throw $e;
        }

        Storage::disk('public')->delete($hapus->pluck('file_path')->all());

        return redirect()->route('pelaksana.proyek.show', $laporan->proyek_id)->with('success', 'Revisi dikirim ulang.');
    }

    /**
     * @param  array<string, UploadedFile>  $berkas  kunci = tahap
     * @param  array<int, string>  $disimpan  path yang ditulis, untuk pembersihan bila gagal
     */
    private function simpanFoto(array $berkas, LaporanProgres $laporan, array &$disimpan): void
    {
        foreach ($berkas as $tahap => $file) {
            $path = $this->gambar->simpan($file);
            $disimpan[] = $path;
            $laporan->foto()->create(['proyek_id' => $laporan->proyek_id, 'tahap' => $tahap, 'file_path' => $path]);
        }
    }

    private function milikSendiri(Request $request, Proyek $proyek): void
    {
        abort_unless($proyek->pelaksana_id === $request->user()->id, 404);
    }

    private function bisaDirevisi(Request $request, LaporanProgres $laporan): void
    {
        abort_unless($laporan->pelaksana_id === $request->user()->id, 404);
        abort_unless($laporan->status_verifikasi === 'Ditolak', 403);
    }
}
