<?php

namespace Tests\Feature;

use App\Models\Anggaran;
use App\Models\DokumentasiFoto;
use App\Models\LaporanProgres;
use App\Models\PengaduanMasyarakat;
use App\Models\Proyek;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublikTest extends TestCase
{
    use RefreshDatabase;

    private Proyek $publik;

    private Proyek $internal;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Storage::fake('public');
        $pelaksana = User::factory()->create();
        $this->publik = $this->buatProyek($pelaksana, 'Jalan Publik', true);
        $this->internal = $this->buatProyek($pelaksana, 'Rahasia Internal', false);
    }

    private function buatProyek(User $pelaksana, string $nama, bool $publik): Proyek
    {
        $proyek = Proyek::create([
            'nama_proyek' => $nama, 'lokasi' => 'Dusun I', 'pelaksana_id' => $pelaksana->id, 'is_public' => $publik,
            'latitude' => -5.1, 'longitude' => 119.4, 'status_proyek' => 'Berjalan',
            'tanggal_mulai' => now()->subDays(5)->toDateString(), 'tanggal_selesai' => now()->addDays(30)->toDateString(),
        ]);
        Anggaran::create(['proyek_id' => $proyek->id, 'tahun_anggaran' => 2026, 'sumber_dana' => 'DD', 'pagu_anggaran' => 1000]);

        return $proyek;
    }

    /** Menyiapkan CAPTCHA mews yang jawabannya diketahui (session + cache seperti hasil render gambar). */
    private function siapkanCaptcha(string $jawaban = 'abcd'): void
    {
        $key = Hash::make($jawaban);
        Cache::put('captcha_'.md5($key), true, 60);
        $this->withSession(['captcha' => ['sensitive' => false, 'key' => $key, 'encrypt' => false]]);
    }

    /** @return array<string, mixed> */
    private function dataAduan(array $override = []): array
    {
        return $override + [
            'nama_pelapor' => 'Budi', 'kontak_pelapor' => '08123456789', 'lokasi_kejadian' => 'Dusun I',
            'isi_pengaduan' => 'Jalan rusak', 'proyek_id' => $this->publik->id, 'captcha' => 'abcd',
        ];
    }

    public function test_halaman_publik_dapat_diakses_tanpa_login(): void
    {
        foreach (['beranda', 'proyek.publik', 'peta', 'transparansi', 'pengaduan.create', 'pengaduan.cek'] as $rute) {
            $this->get(route($rute))->assertOk();
        }
    }

    public function test_proyek_non_publik_tidak_muncul_di_beranda_katalog_peta_dan_anggaran(): void
    {
        $this->get(route('beranda'))->assertInertia(fn (Assert $p) => $p->where('statistik.total', 1)->where('anggaran.pagu', fn ($v) => (float) $v === 1000.0)->has('terbaru', 1));
        $this->get(route('proyek.publik'))->assertInertia(fn (Assert $p) => $p->has('proyek.data', 1)->where('proyek.data.0.nama_proyek', 'Jalan Publik'));
        $this->get(route('peta'))->assertInertia(fn (Assert $p) => $p->has('proyek', 1)->where('proyek.0.id', $this->publik->id));
        $this->get(route('transparansi'))->assertInertia(fn (Assert $p) => $p->has('rincian', 1)->where('total.pagu', fn ($v) => (float) $v === 1000.0));
    }

    public function test_detail_proyek_non_publik_404(): void
    {
        $this->get(route('proyek.publik.show', $this->internal))->assertNotFound();
        $this->get(route('proyek.publik.show', $this->publik))->assertOk();
    }

    public function test_filter_katalog_berdasarkan_status_dan_pencarian(): void
    {
        $this->get(route('proyek.publik', ['status' => 'Selesai']))->assertInertia(fn (Assert $p) => $p->has('proyek.data', 0));
        $this->get(route('proyek.publik', ['q' => 'Jalan', 'tahun' => 2026]))->assertInertia(fn (Assert $p) => $p->has('proyek.data', 1));
    }

    public function test_galeri_dan_riwayat_hanya_dari_laporan_disetujui(): void
    {
        foreach (['Disetujui' => 'ok.webp', 'Menunggu' => 'tunggu.webp'] as $status => $file) {
            $laporan = LaporanProgres::create([
                'proyek_id' => $this->publik->id, 'pelaksana_id' => $this->publik->pelaksana_id, 'tanggal_laporan' => now()->toDateString(),
                'persentase_fisik' => 10, 'keterangan' => "Laporan {$status}",
            ]);
            $laporan->forceFill(['status_verifikasi' => $status])->save();
            DokumentasiFoto::create(['laporan_id' => $laporan->id, 'proyek_id' => $this->publik->id, 'tahap' => 'Sebelum', 'file_path' => $file]);
        }

        $this->get(route('proyek.publik.show', $this->publik))->assertInertia(fn (Assert $p) => $p
            ->has('riwayat', 1)->where('riwayat.0.keterangan', 'Laporan Disetujui')
            ->has('galeri.Sebelum', 1)->where('galeri.Sebelum.0.file_path', 'ok.webp'));
    }

    public function test_pengaduan_dengan_captcha_benar_menghasilkan_tiket(): void
    {
        $this->siapkanCaptcha();

        $respons = $this->post(route('pengaduan.store'), $this->dataAduan(['foto_bukti' => UploadedFile::fake()->image('b.jpg', 2000, 1000)]));

        $aduan = PengaduanMasyarakat::firstOrFail();
        $this->assertMatchesRegularExpression('/^ADU-\d{4}-[A-Z0-9]{4}$/', $aduan->kode_tiket);
        $respons->assertRedirect(route('pengaduan.create'))->assertSessionHas('ticket_code', $aduan->kode_tiket);
        $this->assertSame('Menunggu', $aduan->fresh()->status_pengaduan);
        Storage::disk('public')->assertExists($aduan->foto_bukti);
    }

    public function test_pengaduan_captcha_salah_ditolak(): void
    {
        $this->siapkanCaptcha();

        $this->post(route('pengaduan.store'), $this->dataAduan(['captcha' => 'salah']))->assertSessionHasErrors('captcha');
        $this->assertSame(0, PengaduanMasyarakat::count());
    }

    public function test_pengaduan_ke_proyek_non_publik_ditolak(): void
    {
        $this->siapkanCaptcha();

        $this->post(route('pengaduan.store'), $this->dataAduan(['proyek_id' => $this->internal->id]))->assertSessionHasErrors('proyek_id');
        $this->assertSame(0, PengaduanMasyarakat::count());
    }

    public function test_pengaduan_menolak_berkas_bukan_gambar(): void
    {
        $this->siapkanCaptcha();

        $this->post(route('pengaduan.store'), $this->dataAduan(['foto_bukti' => UploadedFile::fake()->create('x.php', 10, 'text/x-php')]))
            ->assertSessionHasErrors('foto_bukti');
    }

    public function test_cek_tiket_menyembunyikan_kontak_pelapor(): void
    {
        $aduan = PengaduanMasyarakat::create([
            'kode_tiket' => 'ADU-2026-ABCD', 'nama_pelapor' => 'Budi', 'kontak_pelapor' => '08123456789',
            'lokasi_kejadian' => 'Dusun I', 'isi_pengaduan' => 'Jalan rusak',
        ]);
        $aduan->forceFill(['status_pengaduan' => 'Diproses', 'tanggapan_pemdes' => 'Sedang ditinjau'])->save();

        $respons = $this->get(route('pengaduan.cek', ['kode' => 'adu-2026-abcd']));

        $respons->assertInertia(fn (Assert $p) => $p
            ->where('hasil.status_pengaduan', 'Diproses')->where('hasil.tanggapan_pemdes', 'Sedang ditinjau')
            ->missing('hasil.kontak_pelapor')->missing('hasil.nama_pelapor')->missing('hasil.ditanggapi_oleh'));
        $respons->assertDontSee('08123456789');
    }

    public function test_cek_tiket_tidak_ditemukan(): void
    {
        $this->get(route('pengaduan.cek', ['kode' => 'ADU-2026-ZZZZ']))->assertInertia(fn (Assert $p) => $p->where('hasil', null));
    }
}
