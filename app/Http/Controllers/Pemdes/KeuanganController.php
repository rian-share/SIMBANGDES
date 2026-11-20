<?php

namespace App\Http\Controllers\Pemdes;

use App\Http\Controllers\Controller;
use App\Models\Anggaran;
use App\Models\Proyek;
use App\Models\RabKomponen;
use App\Models\TransaksiPengeluaran;
use App\Services\KalkulasiAnggaranService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class KeuanganController extends Controller
{
    public function __construct(private KalkulasiAnggaranService $service) {}

    public function anggaran(): Response
    {
        $anggaran = Anggaran::with('proyek:id,nama_proyek,status_proyek')
            ->withCount('komponen')
            ->withSum('komponen as total_rencana', 'nominal_rencana')
            ->orderByDesc('tahun_anggaran')->orderByDesc('id')
            ->paginate(10);

        $ringkasan = Anggaran::selectRaw('COALESCE(SUM(pagu_anggaran),0) as pagu, COALESCE(SUM(total_realisasi),0) as realisasi, COALESCE(SUM(sisa_anggaran),0) as sisa')
            ->toBase()->first();

        return Inertia::render('Pemdes/Keuangan/Anggaran', [
            'anggaran' => $anggaran->through(fn (Anggaran $a) => $a->append('persentase_serapan')),
            'ringkasan' => $ringkasan,
        ]);
    }

    public function pengeluaran(Request $request): Response
    {
        $request->validate([
            'proyek' => ['nullable', 'integer', 'exists:proyek,id'],
            'komponen' => ['nullable', 'string', 'max:100'],
            'dari' => ['nullable', 'date'],
            'sampai' => ['nullable', 'date'],
        ]);

        $transaksi = TransaksiPengeluaran::with('anggaran.proyek:id,nama_proyek', 'komponen:id,nama_komponen', 'pembuat:id,nama_lengkap')
            ->when($request->query('proyek'), fn ($q, $id) => $q->whereIn('anggaran_id', Anggaran::where('proyek_id', $id)->select('id')))
            ->when($request->query('komponen'), fn ($q, $nama) => $nama === '_tanpa'
                ? $q->whereNull('rab_komponen_id')
                : $q->whereIn('rab_komponen_id', RabKomponen::where('nama_komponen', $nama)->select('id')))
            ->when($request->query('dari'), fn ($q, $d) => $q->whereDate('tanggal_transaksi', '>=', $d))
            ->when($request->query('sampai'), fn ($q, $d) => $q->whereDate('tanggal_transaksi', '<=', $d))
            ->latest('tanggal_transaksi')->latest('id')
            ->paginate(15)->withQueryString();

        return Inertia::render('Pemdes/Keuangan/Pengeluaran', [
            'transaksi' => $transaksi,
            'filter' => $request->only('proyek', 'komponen', 'dari', 'sampai'),
            'proyekPilihan' => $this->proyekPilihan(),
            'namaKomponen' => RabKomponen::distinct()->orderBy('nama_komponen')->pluck('nama_komponen'),
        ]);
    }

    public function rencanaRealisasi(Request $request): Response
    {
        $request->validate(['proyek' => ['nullable', 'integer', 'exists:proyek,id']]);

        $anggaran = $request->query('proyek')
            ? Anggaran::where('proyek_id', $request->query('proyek'))->firstOrFail()
            : null;

        return Inertia::render('Pemdes/Keuangan/RencanaRealisasi', [
            'data' => $this->service->rencanaVsRealisasi($anggaran),
            'proyekPilihan' => Proyek::orderBy('nama_proyek')->get(['id', 'nama_proyek']),
            'filter' => $request->only('proyek'),
        ]);
    }

    /**
     * Proyek berikut komponennya, untuk dropdown form pengeluaran.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function proyekPilihan(): Collection
    {
        return Proyek::with('anggaran:id,proyek_id', 'anggaran.komponen:id,anggaran_id,nama_komponen')
            ->orderBy('nama_proyek')->get(['id', 'nama_proyek'])
            ->map(fn (Proyek $p) => [
                'id' => $p->id,
                'nama_proyek' => $p->nama_proyek,
                'komponen' => $p->anggaran?->komponen->map->only('id', 'nama_komponen')->values() ?? [],
            ]);
    }
}
