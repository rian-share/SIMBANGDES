<?php

namespace Tests\Feature;

use App\Models\Anggaran;
use App\Models\LaporanProgres;
use App\Models\LogAktivitas;
use App\Models\Proyek;
use App\Models\RabKomponen;
use App\Models\TransaksiPengeluaran;
use App\Models\User;
use App\Services\KalkulasiAnggaranService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use LogicException;
use Tests\TestCase;

class PemdesExtraTest extends TestCase
{
    use RefreshDatabase;

    private User $pemdes;

    private User $pelaksana;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Storage::fake('public');
        $this->pemdes = User::factory()->role('pemdes')->create();
        $this->pelaksana = User::factory()->create();
    }

    private function buatProyek(string $pagu = '150000000.00', string $nama = 'Jalan Usaha Tani'): Proyek
    {
        $proyek = Proyek::create([
            'nama_proyek' => $nama,
            'lokasi' => 'Dusun I',
            'pelaksana_id' => $this->pelaksana->id,
            'tanggal_mulai' => now()->subDays(10)->toDateString(),
            'tanggal_selesai' => now()->addDays(30)->toDateString(),
        ]);
        $anggaran = Anggaran::create(['proyek_id' => $proyek->id, 'tahun_anggaran' => 2026, 'sumber_dana' => 'DD', 'pagu_anggaran' => $pagu]);
        app(KalkulasiAnggaranService::class)->rekalkulasi($anggaran);

        return $proyek;
    }

    private function komponen(Proyek $proyek, string $nama, string $rencana): RabKomponen
    {
        return RabKomponen::factory()->create(['anggaran_id' => $proyek->anggaran()->value('id'), 'nama_komponen' => $nama, 'nominal_rencana' => $rencana]);
    }

    private function transaksi(Proyek $proyek, ?RabKomponen $komponen, string $nominal): TransaksiPengeluaran
    {
        return app(KalkulasiAnggaranService::class)->simpanTransaksi($proyek->anggaran()->firstOrFail(), [
            'rab_komponen_id' => $komponen?->id,
            'tanggal_transaksi' => now()->toDateString(),
            'uraian' => 'Belanja '.($komponen?->nama_komponen ?? 'lain'),
            'nominal' => $nominal,
            'created_by' => $this->pemdes->id,
        ]);
    }

    /** Proyek dengan data contoh: Material 40/45, Tenaga Kerja 30/28, Transportasi 10/12 (jt). */
    private function proyekContoh(): Proyek
    {
        $proyek = $this->buatProyek();
        $material = $this->komponen($proyek, 'Material', '40000000.00');
        $tenaga = $this->komponen($proyek, 'Tenaga Kerja', '30000000.00');
        $transport = $this->komponen($proyek, 'Transportasi', '10000000.00');
        $this->transaksi($proyek, $material, '45000000.00');
        $this->transaksi($proyek, $tenaga, '28000000.00');
        $this->transaksi($proyek, $transport, '12000000.00');

        return $proyek;
    }

    public function test_rencana_vs_realisasi_menghitung_selisih_per_komponen(): void
    {
        $proyek = $this->proyekContoh();
        $this->transaksi($proyek, null, '1000000.00');

        $hasil = collect(app(KalkulasiAnggaranService::class)->rencanaVsRealisasi($proyek->anggaran)['baris'])->keyBy('komponen');

        $this->assertSame('5000000.00', $hasil['Material']['selisih']);
        $this->assertSame('-2000000.00', $hasil['Tenaga Kerja']['selisih']);
        $this->assertSame('2000000.00', $hasil['Transportasi']['selisih']);
        $this->assertSame('1000000.00', $hasil['Tanpa Komponen']['selisih']);

        $total = app(KalkulasiAnggaranService::class)->rencanaVsRealisasi($proyek->anggaran)['total'];
        $this->assertSame('80000000.00', $total['rencana']);
        $this->assertSame('86000000.00', $total['realisasi']);
    }

    public function test_rekap_desa_menggabungkan_komponen_sama_antar_proyek(): void
    {
        $a = $this->proyekContoh();
        $b = $this->buatProyek('50000000.00', 'Drainase');
        $this->komponen($b, 'Material', '10000000.00');

        $baris = collect(app(KalkulasiAnggaranService::class)->rencanaVsRealisasi()['baris'])->keyBy('komponen');

        $this->assertSame('50000000.00', $baris['Material']['rencana']);
        $this->assertSame('45000000.00', $baris['Material']['realisasi']);

        $this->actingAs($this->pemdes)->get(route('pemdes.keuangan.rencana-realisasi', ['proyek' => $a->id]))
            ->assertInertia(fn (Assert $p) => $p->component('Pemdes/Keuangan/RencanaRealisasi')->has('data.baris', 3));
    }

    public function test_total_rencana_tidak_boleh_melebihi_pagu_dan_pagu_tidak_boleh_di_bawah_rencana(): void
    {
        $proyek = $this->buatProyek('100000000.00');
        $this->komponen($proyek, 'Material', '90000000.00');

        $this->actingAs($this->pemdes)
            ->post(route('pemdes.komponen.store', $proyek), ['nama_komponen' => 'Peralatan', 'nominal_rencana' => '20000000'])
            ->assertSessionHasErrors('nominal_rencana');

        $this->patch(route('pemdes.anggaran.update', $proyek), ['sumber_dana' => 'DD', 'pagu_anggaran' => '80000000'])
            ->assertSessionHasErrors('pagu_anggaran');

        $this->post(route('pemdes.komponen.store', $proyek), ['nama_komponen' => 'Peralatan', 'nominal_rencana' => '10000000'])
            ->assertSessionHasNoErrors();
        $this->post(route('pemdes.komponen.store', $proyek), ['nama_komponen' => 'Peralatan', 'nominal_rencana' => '1'])
            ->assertSessionHasErrors('nama_komponen');
    }

    public function test_transaksi_tanpa_komponen_tetap_bisa_dicatat_dan_komponen_lintas_proyek_ditolak(): void
    {
        $proyek = $this->buatProyek();
        $lain = $this->buatProyek('10000000.00', 'Proyek Lain');
        $milikSendiri = $this->komponen($proyek, 'Material', '10000000.00');
        $milikLain = $this->komponen($lain, 'Material', '5000000.00');
        $data = ['tanggal_transaksi' => now()->toDateString(), 'uraian' => 'Semen', 'nominal' => '1000000'];

        $this->actingAs($this->pemdes)->post(route('pemdes.transaksi.store', $proyek), $data)->assertSessionHasNoErrors();
        $this->post(route('pemdes.transaksi.store', $proyek), $data + ['rab_komponen_id' => $milikSendiri->id])->assertSessionHasNoErrors();
        $this->post(route('pemdes.transaksi.store', $proyek), $data + ['rab_komponen_id' => $milikLain->id])->assertSessionHasErrors('rab_komponen_id');

        $this->assertSame(2, TransaksiPengeluaran::count());
        $this->assertSame('2000000.00', $proyek->anggaran()->first()->total_realisasi);
    }

    public function test_komponen_yang_punya_transaksi_tidak_bisa_dihapus(): void
    {
        $proyek = $this->buatProyek();
        $terpakai = $this->komponen($proyek, 'Material', '10000000.00');
        $kosong = $this->komponen($proyek, 'Peralatan', '5000000.00');
        $this->transaksi($proyek, $terpakai, '1000000.00');

        $this->actingAs($this->pemdes)->delete(route('pemdes.komponen.destroy', $terpakai))->assertStatus(422);
        $this->delete(route('pemdes.komponen.destroy', $kosong))->assertRedirect();

        $this->assertDatabaseHas('rab_komponen', ['id' => $terpakai->id]);
        $this->assertDatabaseMissing('rab_komponen', ['id' => $kosong->id]);
    }

    public function test_observer_mencatat_proyek_id_dan_label_informatif(): void
    {
        $proyek = $this->buatProyek();
        $pelaksanaBaru = User::factory()->create(['nama_lengkap' => 'CV Karya Desa']);
        $this->actingAs($this->pemdes);

        $proyek->update(['pelaksana_id' => $pelaksanaBaru->id]);
        $this->patch(route('pemdes.anggaran.update', $proyek), ['sumber_dana' => 'DD', 'pagu_anggaran' => '160000000']);
        $this->post(route('pemdes.transaksi.store', $proyek), ['tanggal_transaksi' => now()->toDateString(), 'uraian' => 'Semen', 'nominal' => '2000000']);

        $log = LogAktivitas::where('proyek_id', $proyek->id)->pluck('aktivitas');
        $this->assertTrue($log->contains("Update Proyek #{$proyek->id}: Jalan Usaha Tani — pelaksana: CV Karya Desa"));
        $this->assertTrue($log->contains("Update Anggaran #{$proyek->anggaran()->value('id')}: proyek #{$proyek->id} — pagu Rp 150.000.000 → Rp 160.000.000"));
        $this->assertTrue($log->contains(fn ($l) => str_starts_with($l, 'Create TransaksiPengeluaran #') && str_contains($l, 'Semen (Rp 2.000.000)')));
    }

    public function test_pengiriman_dan_verifikasi_laporan_tercatat_di_riwayat_proyek(): void
    {
        $proyek = $this->buatProyek();
        $laporan = $this->actingAs($this->pelaksana)->postLaporan($proyek);
        $this->actingAs($this->pemdes)->post(route('pemdes.laporan.approve', $laporan))->assertRedirect();

        $uraian = LogAktivitas::where('proyek_id', $proyek->id)->oldest('id')->get()->map->uraian;

        $this->assertSame('mengirim laporan progres', $uraian->first()['judul']);
        $this->assertTrue($uraian->contains(fn ($u) => $u['judul'] === 'memverifikasi laporan' && $u['aksi'] === 'Disetujui'));
        $this->assertTrue($uraian->contains(fn ($u) => $u['judul'] === 'memperbarui proyek' && str_contains($u['detail'], 'progres 0.00% → 50.00%')));
    }

    public function test_audit_trail_tetap_read_only_setelah_kolom_proyek_id(): void
    {
        $log = LogAktivitas::create(['aktivitas' => 'uji', 'proyek_id' => 1]);

        try {
            $log->update(['aktivitas' => 'diubah']);
            $this->fail('Update harus ditolak.');
        } catch (LogicException) {
            $this->assertSame('uji', $log->fresh()->aktivitas);
        }

        $this->expectException(LogicException::class);
        $log->delete();
    }

    public function test_halaman_keuangan_detail_dan_riwayat_dirender_tanpa_lazy_loading(): void
    {
        $proyek = $this->proyekContoh();
        $this->actingAs($this->pemdes);
        $proyek->update(['pelaksana_id' => User::factory()->create()->id]);

        $this->get(route('pemdes.keuangan.anggaran'))
            ->assertInertia(fn (Assert $p) => $p->component('Pemdes/Keuangan/Anggaran')->has('anggaran.data', 1)->where('anggaran.data.0.komponen_count', 3));
        $this->get(route('pemdes.keuangan.pengeluaran', ['proyek' => $proyek->id]))
            ->assertInertia(fn (Assert $p) => $p->component('Pemdes/Keuangan/Pengeluaran')->has('transaksi.data', 3)->has('proyekPilihan.0.komponen', 3));
        $this->get(route('pemdes.keuangan.pengeluaran', ['komponen' => 'Material']))
            ->assertInertia(fn (Assert $p) => $p->has('transaksi.data', 1));
        $this->get(route('pemdes.keuangan.rencana-realisasi'))->assertOk();
        $this->get(route('pemdes.anggaran.show', $proyek))
            ->assertInertia(fn (Assert $p) => $p->component('Pemdes/Anggaran/Show')->has('komponen', 3)->has('rencana.baris', 3));
        $this->get(route('pemdes.proyek.show', $proyek))
            ->assertInertia(fn (Assert $p) => $p->component('Pemdes/Proyek/Show')->has('rencana.baris', 3)->has('transaksi', 3)->has('riwayat')->where('risiko.level', fn ($v) => in_array($v, ['Aman', 'Waspada', 'Kritis'])));
        $this->get(route('pemdes.riwayat.index', ['proyek' => $proyek->id]))
            ->assertInertia(fn (Assert $p) => $p->component('Pemdes/Riwayat/Index')->where('dipilih', $proyek->id)->has('riwayat.data.0.uraian.judul'));
    }

    public function test_jumlah_query_halaman_pengeluaran_tidak_bertambah_per_baris(): void
    {
        $proyek = $this->proyekContoh();
        $this->actingAs($this->pemdes);
        $hitung = function () {
            DB::flushQueryLog();
            DB::enableQueryLog();
            $this->get(route('pemdes.keuangan.pengeluaran'))->assertOk();

            return count(DB::getQueryLog());
        };

        $sedikit = $hitung();
        foreach (range(1, 6) as $i) {
            $this->transaksi($proyek, null, '1000.00');
        }

        $this->assertSame($sedikit, $hitung());
    }

    public function test_pelaksana_dan_tamu_ditolak_dari_halaman_baru(): void
    {
        $proyek = $this->buatProyek();

        foreach (['pemdes.keuangan.anggaran', 'pemdes.keuangan.pengeluaran', 'pemdes.keuangan.rencana-realisasi', 'pemdes.riwayat.index'] as $nama) {
            $this->actingAs($this->pelaksana)->get(route($nama))->assertForbidden();
        }
        $this->actingAs($this->pelaksana)->get(route('pemdes.proyek.show', $proyek))->assertForbidden();
        auth()->logout();
        $this->get(route('pemdes.riwayat.index'))->assertRedirect(route('login'));
    }

    public function test_seeder_menghasilkan_komponen_transaksi_dan_riwayat(): void
    {
        $this->seed(DatabaseSeeder::class);

        $anggaran = Anggaran::orderBy('id')->first();
        $baris = collect(app(KalkulasiAnggaranService::class)->rencanaVsRealisasi($anggaran)['baris'])->keyBy('komponen');

        $this->assertCount(5, $baris);
        $this->assertSame('45000000.00', $baris['Material']['realisasi']);
        $this->assertSame('-2000000.00', $baris['Tenaga Kerja']['selisih']);
        $this->assertGreaterThan(0, LogAktivitas::whereNotNull('proyek_id')->count());
        $this->assertTrue(LogAktivitas::where('proyek_id', $anggaran->proyek_id)->get()->contains(fn ($l) => $l->uraian['judul'] === 'membuat proyek'));
    }

    /** Helper: pelaksana mengirim laporan lewat endpoint nyata (dengan foto minimal). */
    private function postLaporan(Proyek $proyek): LaporanProgres
    {
        $this->post(route('pelaksana.laporan.store', $proyek), [
            'persentase_fisik' => '50',
            'keterangan' => 'Progres berjalan',
            'foto' => ['Sebelum' => UploadedFile::fake()->image('a.jpg', 100, 100)],
        ])->assertSessionHasNoErrors();

        return LaporanProgres::where('proyek_id', $proyek->id)->firstOrFail();
    }
}
