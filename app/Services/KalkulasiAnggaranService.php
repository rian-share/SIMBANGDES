<?php

namespace App\Services;

use App\Models\Anggaran;
use App\Models\RabKomponen;
use App\Models\TransaksiPengeluaran;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class KalkulasiAnggaranService
{
    /**
     * Hitung ulang total_realisasi & sisa_anggaran langsung di SQL (aritmetika DECIMAL eksak, BR-FIN 1.1).
     * Kedua kolom memakai subquery yang sama agar hasilnya tidak bergantung urutan evaluasi SET antar-DBMS.
     */
    public function rekalkulasi(Anggaran $anggaran): void
    {
        $sum = '(SELECT COALESCE(SUM(nominal), 0) FROM transaksi_pengeluaran WHERE anggaran_id = ?)';

        DB::update(
            "UPDATE anggaran SET total_realisasi = $sum, sisa_anggaran = pagu_anggaran - $sum, updated_at = ? WHERE id = ?",
            [$anggaran->id, $anggaran->id, now(), $anggaran->id],
        );

        $anggaran->refresh();
    }

    /**
     * Buat atau ubah transaksi. $lama diisi saat update agar nominal lamanya tidak dihitung dua kali.
     *
     * @param  array<string, mixed>  $data
     */
    public function simpanTransaksi(Anggaran $anggaran, array $data, ?TransaksiPengeluaran $lama = null): TransaksiPengeluaran
    {
        return DB::transaction(function () use ($anggaran, $data, $lama) {
            $terkunci = Anggaran::whereKey($anggaran->id)->lockForUpdate()->firstOrFail();

            $totalBaru = bcadd(
                bcsub((string) $terkunci->total_realisasi, (string) ($lama?->nominal ?? '0'), 2),
                number_format((float) $data['nominal'], 2, '.', ''),
                2,
            );

            if (bccomp($totalBaru, (string) $terkunci->pagu_anggaran, 2) > 0) {
                throw ValidationException::withMessages([
                    'nominal' => 'Pengeluaran melebihi sisa pagu anggaran yang tersedia.',
                ]);
            }

            $transaksi = $lama ?? new TransaksiPengeluaran(['anggaran_id' => $terkunci->id]);
            $transaksi->fill($data)->save();

            $this->rekalkulasi($terkunci);
            $anggaran->refresh();

            return $transaksi;
        });
    }

    public function hapusTransaksi(TransaksiPengeluaran $transaksi): void
    {
        DB::transaction(function () use ($transaksi) {
            $anggaran = Anggaran::whereKey($transaksi->anggaran_id)->lockForUpdate()->firstOrFail();

            if ($transaksi->bukti_transaksi) {
                Storage::disk('public')->delete($transaksi->bukti_transaksi);
            }
            $transaksi->delete();

            $this->rekalkulasi($anggaran);
        });
    }

    /**
     * Rencana vs realisasi per komponen. $anggaran null = rekap seluruh desa (digabung per nama_komponen).
     * Selisih positif = melebihi rencana. Semua nominal berupa string DECIMAL(15,2).
     *
     * @return array{baris: list<array{komponen: string, rencana: string, realisasi: string, selisih: string}>, total: array{rencana: string, realisasi: string, selisih: string}}
     */
    public function rencanaVsRealisasi(?Anggaran $anggaran = null): array
    {
        $dec = fn (mixed $n): string => number_format((float) $n, 2, '.', '');

        $komponen = RabKomponen::query()
            ->when($anggaran, fn ($q) => $q->where('anggaran_id', $anggaran->id))
            ->withSum('transaksi as realisasi', 'nominal')
            ->orderBy('nama_komponen')->orderBy('id')
            ->get();

        $baris = [];
        foreach ($komponen as $k) {
            $nama = $k->nama_komponen;
            $baris[$nama] ??= ['komponen' => $nama, 'rencana' => '0.00', 'realisasi' => '0.00'];
            $baris[$nama]['rencana'] = bcadd($baris[$nama]['rencana'], $dec($k->nominal_rencana), 2);
            $baris[$nama]['realisasi'] = bcadd($baris[$nama]['realisasi'], $dec($k->realisasi), 2);
        }

        $tanpa = TransaksiPengeluaran::whereNull('rab_komponen_id')
            ->when($anggaran, fn ($q) => $q->where('anggaran_id', $anggaran->id))
            ->selectRaw('COALESCE(SUM(nominal), 0) as total')->value('total');
        if (bccomp($dec($tanpa), '0', 2) > 0) {
            $baris['Tanpa Komponen'] = ['komponen' => 'Tanpa Komponen', 'rencana' => '0.00', 'realisasi' => $dec($tanpa)];
        }

        $total = ['rencana' => '0.00', 'realisasi' => '0.00'];
        foreach ($baris as &$b) {
            $b['selisih'] = bcsub($b['realisasi'], $b['rencana'], 2);
            $total['rencana'] = bcadd($total['rencana'], $b['rencana'], 2);
            $total['realisasi'] = bcadd($total['realisasi'], $b['realisasi'], 2);
        }
        unset($b);
        $total['selisih'] = bcsub($total['realisasi'], $total['rencana'], 2);

        return ['baris' => array_values($baris), 'total' => $total];
    }

    /**
     * Buat/ubah komponen rencana; total rencana tidak boleh melebihi pagu (K-4e).
     *
     * @param  array<string, mixed>  $data
     */
    public function simpanKomponen(Anggaran $anggaran, array $data, ?RabKomponen $lama = null): RabKomponen
    {
        return DB::transaction(function () use ($anggaran, $data, $lama) {
            $terkunci = Anggaran::whereKey($anggaran->id)->lockForUpdate()->firstOrFail();

            $totalLain = (string) RabKomponen::where('anggaran_id', $terkunci->id)
                ->when($lama, fn ($q) => $q->whereKeyNot($lama->id))->sum('nominal_rencana');
            $totalBaru = bcadd(number_format((float) $totalLain, 2, '.', ''), number_format((float) $data['nominal_rencana'], 2, '.', ''), 2);

            if (bccomp($totalBaru, (string) $terkunci->pagu_anggaran, 2) > 0) {
                throw ValidationException::withMessages([
                    'nominal_rencana' => 'Total rencana komponen melebihi pagu anggaran.',
                ]);
            }

            $komponen = $lama ?? new RabKomponen(['anggaran_id' => $terkunci->id]);
            $komponen->fill($data)->save();

            return $komponen;
        });
    }
}
