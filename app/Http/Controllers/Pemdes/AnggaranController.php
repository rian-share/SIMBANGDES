<?php

namespace App\Http\Controllers\Pemdes;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pemdes\TransaksiRequest;
use App\Http\Requests\Pemdes\UpdateAnggaranRequest;
use App\Models\Proyek;
use App\Models\TransaksiPengeluaran;
use App\Services\KalkulasiAnggaranService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AnggaranController extends Controller
{
    public function __construct(private KalkulasiAnggaranService $service) {}

    public function show(Proyek $proyek): Response
    {
        $anggaran = $proyek->anggaran()->firstOrFail();

        return Inertia::render('Pemdes/Anggaran/Show', [
            'proyek' => $proyek->only('id', 'nama_proyek', 'status_proyek'),
            'anggaran' => $anggaran->append('persentase_serapan'),
            'transaksi' => $anggaran->transaksi()->with('komponen:id,nama_komponen')->orderByDesc('tanggal_transaksi')->orderByDesc('id')->get(),
            'komponen' => $anggaran->komponen()->orderBy('nama_komponen')->get(),
            'rencana' => $this->service->rencanaVsRealisasi($anggaran),
        ]);
    }

    public function update(UpdateAnggaranRequest $request, Proyek $proyek): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($proyek, $data) {
            $anggaran = $proyek->anggaran()->lockForUpdate()->firstOrFail();

            // V-09: pagu baru tidak boleh di bawah total realisasi.
            if (bccomp(number_format((float) $data['pagu_anggaran'], 2, '.', ''), (string) $anggaran->total_realisasi, 2) < 0) {
                throw ValidationException::withMessages([
                    'pagu_anggaran' => 'Pagu tidak boleh lebih kecil dari total realisasi yang sudah tercatat.',
                ]);
            }

            // K-4f: pagu tidak boleh di bawah total rencana komponen.
            if (bccomp(number_format((float) $data['pagu_anggaran'], 2, '.', ''), number_format((float) $anggaran->komponen()->sum('nominal_rencana'), 2, '.', ''), 2) < 0) {
                throw ValidationException::withMessages([
                    'pagu_anggaran' => 'Pagu tidak boleh lebih kecil dari total rencana komponen.',
                ]);
            }

            $anggaran->update($data);
            $this->service->rekalkulasi($anggaran);
        });

        return back()->with('success', 'Pagu anggaran diperbarui.');
    }

    public function storeTransaksi(TransaksiRequest $request, Proyek $proyek): RedirectResponse
    {
        $data = $request->safe()->except('bukti_transaksi') + ['created_by' => $request->user()->id];

        $this->simpan($proyek->anggaran()->firstOrFail(), $data, $request->file('bukti_transaksi'));

        return back()->with('success', 'Transaksi dicatat.');
    }

    public function updateTransaksi(TransaksiRequest $request, TransaksiPengeluaran $transaksi): RedirectResponse
    {
        $this->simpan($transaksi->anggaran, $request->safe()->except('bukti_transaksi'), $request->file('bukti_transaksi'), $transaksi);

        return back()->with('success', 'Transaksi diperbarui.');
    }

    public function destroyTransaksi(TransaksiPengeluaran $transaksi): RedirectResponse
    {
        $this->service->hapusTransaksi($transaksi);

        return back()->with('success', 'Transaksi dihapus.');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function simpan($anggaran, array $data, ?UploadedFile $bukti, ?TransaksiPengeluaran $lama = null): void
    {
        $pathLama = $lama?->bukti_transaksi;

        if ($bukti) {
            $data['bukti_transaksi'] = $bukti->storeAs('bukti-transaksi', Str::uuid().'.'.$bukti->extension(), 'public');
        }

        try {
            $this->service->simpanTransaksi($anggaran, $data, $lama);
        } catch (\Throwable $e) {
            if ($bukti) {
                Storage::disk('public')->delete($data['bukti_transaksi']);
            }
            throw $e;
        }

        if ($bukti && $pathLama) {
            Storage::disk('public')->delete($pathLama);
        }
    }
}
