<?php

namespace Tests\Feature;

use App\Models\Anggaran;
use App\Models\DokumentasiFoto;
use App\Models\LaporanProgres;
use App\Models\PengaduanMasyarakat;
use App\Models\Proyek;
use App\Models\TransaksiPengeluaran;
use App\Models\User;
use App\Services\KalkulasiAnggaranService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PemdesTest extends TestCase
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

    private function buatProyek(string $pagu = '1000000.00', array $override = []): Proyek
    {
        $proyek = Proyek::create($override + [
            'nama_proyek' => 'Jalan Usaha Tani',
            'lokasi' => 'Dusun I',
            'pelaksana_id' => $this->pelaksana->id,
            'tanggal_mulai' => now()->subDays(10)->toDateString(),
            'tanggal_selesai' => now()->addDays(30)->toDateString(),
        ]);
        $anggaran = Anggaran::create(['proyek_id' => $proyek->id, 'tahun_anggaran' => 2026, 'sumber_dana' => 'DD', 'pagu_anggaran' => $pagu]);
        app(KalkulasiAnggaranService::class)->rekalkulasi($anggaran);

        return $proyek;
    }

    /** @return array<string, mixed> */
    private function dataProyek(array $override = []): array
    {
        return $override + [
            'nama_proyek' => 'Drainase Dusun II',
            'kategori' => 'Infrastruktur',
            'lokasi' => 'Dusun II',
            'latitude' => -5.1,
            'longitude' => 119.4,
            'pelaksana_id' => $this->pelaksana->id,
            'tanggal_mulai' => '2026-01-01',
            'tanggal_selesai' => '2026-12-31',
            'target_progres' => 100,
            'is_public' => 1,
            'tahun_anggaran' => 2026,
            'sumber_dana' => 'Dana Desa',
            'pagu_anggaran' => 5000000,
        ];
    }

    public function test_dashboard_dirender_untuk_pemdes_dan_ditolak_untuk_pelaksana(): void
    {
        $this->buatProyek();

        $this->actingAs($this->pemdes)->get(route('pemdes.dashboard'))
            ->assertInertia(fn (Assert $p) => $p->component('Pemdes/Dashboard')->where('kpi.total', 1)->has('anggaranPerProyek', 1));

        $this->actingAs($this->pelaksana)->get(route('pemdes.dashboard'))->assertForbidden();
    }

    public function test_tambah_proyek_membuat_anggaran_dengan_sisa_sama_dengan_pagu(): void
    {
        $this->actingAs($this->pemdes)->post(route('pemdes.proyek.store'), $this->dataProyek())->assertRedirect(route('pemdes.proyek.index'));

        $anggaran = Anggaran::firstOrFail();
        $this->assertSame('5000000.00', $anggaran->sisa_anggaran);
        $this->assertDatabaseHas('proyek', ['nama_proyek' => 'Drainase Dusun II', 'status_proyek' => 'Perencanaan']);
    }

    public function test_validasi_proyek_menolak_pelaksana_nonaktif_dan_tanggal_terbalik(): void
    {
        $nonaktif = User::factory()->nonaktif()->create();

        $this->actingAs($this->pemdes)->post(route('pemdes.proyek.store'), $this->dataProyek([
            'pelaksana_id' => $nonaktif->id,
            'tanggal_selesai' => '2025-01-01',
        ]))->assertSessionHasErrors(['pelaksana_id', 'tanggal_selesai']);

        $this->assertDatabaseCount('proyek', 0);
    }

    public function test_perpanjang_tenggat_mengembalikan_proyek_terlambat_ke_berjalan(): void
    {
        $proyek = $this->buatProyek('1000', ['status_proyek' => 'Terlambat']);

        $this->actingAs($this->pemdes)->put(route('pemdes.proyek.update', $proyek), $this->dataProyek([
            'tanggal_selesai' => now()->addMonth()->toDateString(),
        ]))->assertRedirect();

        $this->assertSame('Berjalan', $proyek->fresh()->status_proyek);
    }

    public function test_hapus_proyek_menghapus_berkas_fisik(): void
    {
        $proyek = $this->buatProyek();
        $laporan = LaporanProgres::create(['proyek_id' => $proyek->id, 'pelaksana_id' => $this->pelaksana->id, 'tanggal_laporan' => today(), 'persentase_fisik' => 10, 'keterangan' => 'x']);
        Storage::disk('public')->put('foto/a.jpg', 'x');
        Storage::disk('public')->put('bukti/b.pdf', 'x');
        DokumentasiFoto::create(['laporan_id' => $laporan->id, 'proyek_id' => $proyek->id, 'tahap' => 'Saat', 'file_path' => 'foto/a.jpg']);
        TransaksiPengeluaran::create(['anggaran_id' => $proyek->anggaran->id, 'tanggal_transaksi' => today(), 'uraian' => 'semen', 'nominal' => 100, 'bukti_transaksi' => 'bukti/b.pdf', 'created_by' => $this->pemdes->id]);

        $this->actingAs($this->pemdes)->delete(route('pemdes.proyek.destroy', $proyek))->assertRedirect();

        $this->assertDatabaseCount('proyek', 0);
        Storage::disk('public')->assertMissing(['foto/a.jpg', 'bukti/b.pdf']);
    }

    public function test_transaksi_tersimpan_dengan_bukti_dan_ditolak_bila_melebihi_pagu(): void
    {
        $proyek = $this->buatProyek('1000.00');
        $this->actingAs($this->pemdes);

        $this->post(route('pemdes.transaksi.store', $proyek), [
            'tanggal_transaksi' => today()->toDateString(), 'uraian' => 'Semen', 'nominal' => 600,
            'bukti_transaksi' => UploadedFile::fake()->image('nota.jpg'),
        ])->assertSessionHasNoErrors();

        $transaksi = TransaksiPengeluaran::firstOrFail();
        Storage::disk('public')->assertExists($transaksi->bukti_transaksi);
        $this->assertSame('400.00', $proyek->anggaran->fresh()->sisa_anggaran);

        $this->post(route('pemdes.transaksi.store', $proyek), ['tanggal_transaksi' => today()->toDateString(), 'uraian' => 'Pasir', 'nominal' => 401])
            ->assertSessionHasErrors('nominal');

        // update: nominal lama (600) tidak dihitung dua kali, 1000 pas boleh, 1001 tidak
        $this->post(route('pemdes.transaksi.update', $transaksi), ['tanggal_transaksi' => today()->toDateString(), 'uraian' => 'Semen', 'nominal' => 1001])
            ->assertSessionHasErrors('nominal');
        $this->post(route('pemdes.transaksi.update', $transaksi), ['tanggal_transaksi' => today()->toDateString(), 'uraian' => 'Semen', 'nominal' => 1000])
            ->assertSessionHasNoErrors();
        $this->assertSame('0.00', $proyek->anggaran->fresh()->sisa_anggaran);
    }

    public function test_bukti_lebih_dari_5mb_atau_tipe_salah_ditolak(): void
    {
        $proyek = $this->buatProyek();
        $dasar = ['tanggal_transaksi' => today()->toDateString(), 'uraian' => 'x', 'nominal' => 10];

        $this->actingAs($this->pemdes)->post(route('pemdes.transaksi.store', $proyek), $dasar + ['bukti_transaksi' => UploadedFile::fake()->create('besar.pdf', 5121)])
            ->assertSessionHasErrors('bukti_transaksi');
        $this->post(route('pemdes.transaksi.store', $proyek), $dasar + ['bukti_transaksi' => UploadedFile::fake()->create('x.exe', 10)])
            ->assertSessionHasErrors('bukti_transaksi');
    }

    public function test_pagu_tidak_boleh_diturunkan_di_bawah_realisasi(): void
    {
        $proyek = $this->buatProyek('1000.00');
        $this->actingAs($this->pemdes)->post(route('pemdes.transaksi.store', $proyek), ['tanggal_transaksi' => today()->toDateString(), 'uraian' => 'x', 'nominal' => 600]);

        $this->patch(route('pemdes.anggaran.update', $proyek), ['sumber_dana' => 'DD', 'pagu_anggaran' => 500])->assertSessionHasErrors('pagu_anggaran');
        $this->patch(route('pemdes.anggaran.update', $proyek), ['sumber_dana' => 'DD', 'pagu_anggaran' => 800])->assertSessionHasNoErrors();

        $this->assertSame('200.00', $proyek->anggaran->fresh()->sisa_anggaran);
    }

    private function buatLaporan(Proyek $proyek, float $persen): LaporanProgres
    {
        return LaporanProgres::create(['proyek_id' => $proyek->id, 'pelaksana_id' => $this->pelaksana->id, 'tanggal_laporan' => today(), 'persentase_fisik' => $persen, 'keterangan' => 'Progres']);
    }

    public function test_setujui_laporan_memperbarui_progres_dan_status_proyek(): void
    {
        $proyek = $this->buatProyek('1000', ['status_proyek' => 'Perencanaan']);
        $laporan = $this->buatLaporan($proyek, 40);

        $this->actingAs($this->pemdes)->post(route('pemdes.laporan.approve', $laporan))->assertRedirect();

        $laporan->refresh();
        $this->assertSame('Disetujui', $laporan->status_verifikasi);
        $this->assertSame($this->pemdes->id, (int) $laporan->verified_by);
        $this->assertNotNull($laporan->verified_at);
        $this->assertSame('40.00', $proyek->fresh()->progres_aktual);
        $this->assertSame('Berjalan', $proyek->fresh()->status_proyek);

        $this->post(route('pemdes.laporan.approve', $laporan))->assertStatus(422);

        $final = $this->buatLaporan($proyek, 100);
        $this->post(route('pemdes.laporan.approve', $final));
        $this->assertSame('Selesai', $proyek->fresh()->status_proyek);
    }

    public function test_tolak_laporan_wajib_catatan_dan_tidak_mengubah_progres(): void
    {
        $proyek = $this->buatProyek();
        $laporan = $this->buatLaporan($proyek, 40);
        $this->actingAs($this->pemdes);

        $this->post(route('pemdes.laporan.reject', $laporan), ['catatan_revisi' => 'pendek'])->assertSessionHasErrors('catatan_revisi');
        $this->post(route('pemdes.laporan.reject', $laporan), ['catatan_revisi' => 'Foto kurang jelas, mohon diulang'])->assertSessionHasNoErrors();

        $this->assertSame('Ditolak', $laporan->fresh()->status_verifikasi);
        $this->assertSame('0.00', $proyek->fresh()->progres_aktual);
    }

    public function test_tindak_lanjut_pengaduan(): void
    {
        $pengaduan = PengaduanMasyarakat::create(['kode_tiket' => 'ADU-2026-AB12', 'nama_pelapor' => 'Warga', 'lokasi_kejadian' => 'Dusun I', 'isi_pengaduan' => 'Jalan rusak']);
        $this->actingAs($this->pemdes);

        $this->get(route('pemdes.pengaduan.index', ['status' => 'Menunggu']))->assertInertia(fn (Assert $p) => $p->component('Pemdes/Pengaduan/Index')->has('pengaduan.data', 1));
        $this->patch(route('pemdes.pengaduan.update', $pengaduan), ['status_pengaduan' => 'Menunggu', 'tanggapan_pemdes' => 'ok'])->assertSessionHasErrors('status_pengaduan');
        $this->patch(route('pemdes.pengaduan.update', $pengaduan), ['status_pengaduan' => 'Selesai', 'tanggapan_pemdes' => 'Sudah diperbaiki'])->assertSessionHasNoErrors();

        $pengaduan->refresh();
        $this->assertSame('Selesai', $pengaduan->status_pengaduan);
        $this->assertSame($this->pemdes->id, (int) $pengaduan->ditanggapi_oleh);
    }

    public function test_ekspor_pdf(): void
    {
        $this->buatProyek();

        $respons = $this->actingAs($this->pemdes)->get(route('pemdes.rekap.pdf'));

        $respons->assertOk()->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $respons->getContent());
        $this->assertFalse(config('dompdf.options.enable_remote', config('dompdf.enable_remote')));
        $this->actingAs($this->pelaksana)->get(route('pemdes.rekap.pdf'))->assertForbidden();
    }

    public function test_monitoring_dan_command_sinkron_status(): void
    {
        $mulai = $this->buatProyek('1', ['nama_proyek' => 'A', 'status_proyek' => 'Perencanaan']);
        $lewat = $this->buatProyek('1', ['nama_proyek' => 'B', 'status_proyek' => 'Berjalan', 'tanggal_selesai' => now()->subDay()->toDateString()]);

        $this->actingAs($this->pemdes)->get(route('pemdes.monitoring'))->assertInertia(fn (Assert $p) => $p->component('Pemdes/Monitoring/Index')->has('proyek', 2));

        $this->artisan('proyek:sinkron-status')->assertSuccessful();

        $this->assertSame('Berjalan', $mulai->fresh()->status_proyek);
        $this->assertSame('Terlambat', $lewat->fresh()->status_proyek);
    }
}
