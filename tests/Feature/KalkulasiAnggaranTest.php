<?php

namespace Tests\Feature;

use App\Models\Anggaran;
use App\Models\Proyek;
use App\Models\TransaksiPengeluaran;
use App\Models\User;
use App\Services\KalkulasiAnggaranService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class KalkulasiAnggaranTest extends TestCase
{
    use RefreshDatabase;

    private KalkulasiAnggaranService $service;

    private User $pemdes;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new KalkulasiAnggaranService;
        $this->pemdes = User::factory()->role('pemdes')->create();
    }

    private function buatAnggaran(string $pagu): Anggaran
    {
        $proyek = Proyek::create([
            'nama_proyek' => 'Proyek Uji',
            'lokasi' => 'Dusun I',
            'pelaksana_id' => User::factory()->create()->id,
            'tanggal_mulai' => now()->subDays(10)->toDateString(),
            'tanggal_selesai' => now()->addDays(30)->toDateString(),
        ]);

        $anggaran = Anggaran::create([
            'proyek_id' => $proyek->id,
            'tahun_anggaran' => (int) now()->format('Y'),
            'sumber_dana' => 'Dana Desa',
            'pagu_anggaran' => $pagu,
        ]);
        $anggaran->forceFill(['sisa_anggaran' => $pagu])->save();

        return $anggaran;
    }

    private function catat(Anggaran $anggaran, string $nominal, ?TransaksiPengeluaran $lama = null): TransaksiPengeluaran
    {
        return $this->service->simpanTransaksi($anggaran, [
            'tanggal_transaksi' => now()->toDateString(),
            'uraian' => 'Belanja material',
            'nominal' => $nominal,
            'created_by' => $this->pemdes->id,
        ], $lama);
    }

    public function test_total_sama_dengan_pagu_menghasilkan_sisa_nol(): void
    {
        $anggaran = $this->buatAnggaran('1000000.00');

        $this->catat($anggaran, '250000.50');
        $this->catat($anggaran, '300000.25');
        $this->catat($anggaran, '449999.25');

        $anggaran->refresh();
        $this->assertSame('1000000.00', $anggaran->total_realisasi);
        $this->assertSame('0.00', $anggaran->sisa_anggaran);
    }

    public function test_transaksi_melebihi_pagu_ditolak_dan_saldo_tidak_berubah(): void
    {
        $anggaran = $this->buatAnggaran('500000.00');
        $this->catat($anggaran, '400000.00');

        try {
            $this->catat($anggaran, '100000.01');
            $this->fail('Seharusnya melempar ValidationException.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('nominal', $e->errors());
        }

        $anggaran->refresh();
        $this->assertSame('400000.00', $anggaran->total_realisasi);
        $this->assertSame('100000.00', $anggaran->sisa_anggaran);
        $this->assertSame(1, TransaksiPengeluaran::count());
    }

    public function test_update_transaksi_tidak_menghitung_nominal_lama_dua_kali(): void
    {
        $anggaran = $this->buatAnggaran('500000.00');
        $transaksi = $this->catat($anggaran, '400000.00');

        $this->catat($anggaran, '500000.00', $transaksi);

        $anggaran->refresh();
        $this->assertSame('500000.00', $anggaran->total_realisasi);
        $this->assertSame('0.00', $anggaran->sisa_anggaran);
    }

    public function test_hapus_transaksi_menurunkan_realisasi(): void
    {
        $anggaran = $this->buatAnggaran('1000000.00');
        $this->catat($anggaran, '200000.00');
        $kedua = $this->catat($anggaran, '300000.00');

        $this->service->hapusTransaksi($kedua);

        $anggaran->refresh();
        $this->assertSame('200000.00', $anggaran->total_realisasi);
        $this->assertSame('800000.00', $anggaran->sisa_anggaran);
    }

    public function test_pagu_nol_menghasilkan_serapan_nol(): void
    {
        $anggaran = $this->buatAnggaran('0.00');

        $this->assertSame(0.0, $anggaran->persentase_serapan);
    }
}
