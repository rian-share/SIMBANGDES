<?php

namespace App\Http\Controllers\Pemdes;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pemdes\StoreProyekRequest;
use App\Http\Requests\Pemdes\UpdateProyekRequest;
use App\Models\Anggaran;
use App\Models\Proyek;
use App\Models\User;
use App\Services\AnalisisRisikoService;
use App\Services\KalkulasiAnggaranService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProyekController extends Controller
{
    private const FIELD_PROYEK = [
        'nama_proyek', 'kategori', 'lokasi', 'latitude', 'longitude', 'pelaksana_id',
        'tanggal_mulai', 'tanggal_selesai', 'target_progres', 'is_public', 'deskripsi',
    ];

    public function index(Request $request): Response
    {
        $proyek = Proyek::with('pelaksana:id,nama_lengkap', 'anggaran')
            ->when($request->query('status'), fn ($q, $s) => $q->where('status_proyek', $s))
            ->when($request->query('q'), fn ($q, $kata) => $q->where('nama_proyek', 'like', "%$kata%"))
            ->latest()->paginate(10)->withQueryString();

        return Inertia::render('Pemdes/Proyek/Index', [
            'proyek' => $proyek,
            'filter' => $request->only('status', 'q'),
        ]);
    }

    public function show(Proyek $proyek, KalkulasiAnggaranService $service, AnalisisRisikoService $risiko): Response
    {
        $proyek->load([
            'pelaksana:id,nama_lengkap',
            'anggaran',
            'laporanProgres' => fn ($q) => $q->latest('tanggal_laporan')->latest('id')->limit(5)->with('verifikator:id,nama_lengkap'),
            'dokumentasiFoto:id,proyek_id,tahap,file_path',
            'logAktivitas' => fn ($q) => $q->latest('created_at')->latest('id')->limit(8)->with('user:id,nama_lengkap,role'),
        ]);
        $anggaran = $proyek->anggaran;

        return Inertia::render('Pemdes/Proyek/Show', [
            'proyek' => $proyek->makeHidden(['laporanProgres', 'dokumentasiFoto', 'logAktivitas', 'anggaran']),
            'anggaran' => $anggaran->append('persentase_serapan'),
            'rencana' => $service->rencanaVsRealisasi($anggaran),
            'transaksi' => $anggaran->transaksi()->with('komponen:id,nama_komponen')->latest('tanggal_transaksi')->latest('id')->limit(10)->get(),
            'laporan' => $proyek->laporanProgres,
            'foto' => $proyek->dokumentasiFoto,
            'riwayat' => $proyek->logAktivitas->each->append('uraian'),
            'risiko' => [
                'level' => $risiko->levelRisiko($proyek),
                'target_berjalan' => $risiko->targetBerjalan($proyek),
                'deviasi' => $risiko->deviasi($proyek),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Pemdes/Proyek/Form', ['pelaksana' => $this->daftarPelaksana()]);
    }

    public function store(StoreProyekRequest $request, KalkulasiAnggaranService $anggaranService): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $anggaranService) {
            $proyek = Proyek::create(array_intersect_key($data, array_flip(self::FIELD_PROYEK)));
            $anggaran = Anggaran::create([
                'proyek_id' => $proyek->id,
                'tahun_anggaran' => $data['tahun_anggaran'],
                'sumber_dana' => $data['sumber_dana'],
                'pagu_anggaran' => $data['pagu_anggaran'],
            ]);
            $anggaranService->rekalkulasi($anggaran);
        });

        return redirect()->route('pemdes.proyek.index')->with('success', 'Proyek berhasil dibuat.');
    }

    public function edit(Proyek $proyek): Response
    {
        return Inertia::render('Pemdes/Proyek/Form', [
            'proyek' => $proyek,
            'pelaksana' => $this->daftarPelaksana(),
        ]);
    }

    public function update(UpdateProyekRequest $request, Proyek $proyek): RedirectResponse
    {
        $proyek->fill($request->validated());

        // V-08: tenggat diperpanjang pada proyek terlambat mengembalikannya ke Berjalan.
        if ($proyek->status_proyek === 'Terlambat' && $proyek->tanggal_selesai->greaterThanOrEqualTo(today())) {
            $proyek->status_proyek = 'Berjalan';
        }
        $proyek->save();

        return redirect()->route('pemdes.proyek.index')->with('success', 'Proyek berhasil diperbarui.');
    }

    public function destroy(Proyek $proyek): RedirectResponse
    {
        // V-11: FK cascade tidak menghapus berkas fisik, jadi kumpulkan dan hapus sendiri.
        $berkas = $proyek->dokumentasiFoto()->pluck('file_path')
            ->merge(Anggaran::where('proyek_id', $proyek->id)->first()?->transaksi()->whereNotNull('bukti_transaksi')->pluck('bukti_transaksi') ?? [])
            ->merge($proyek->pengaduan()->whereNotNull('foto_bukti')->pluck('foto_bukti'));

        DB::transaction(fn () => $proyek->delete());

        Storage::disk('public')->delete($berkas->all());

        return redirect()->route('pemdes.proyek.index')->with('success', 'Proyek dihapus.');
    }

    private function daftarPelaksana()
    {
        return User::where('role', 'pelaksana')->where('status_aktif', 1)->orderBy('nama_lengkap')->get(['id', 'nama_lengkap']);
    }
}
