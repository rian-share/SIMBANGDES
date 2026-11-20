<?php

namespace Tests\Feature;

use App\Models\PengaduanMasyarakat;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class KeamananTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Storage::fake('public');
    }

    private function siapkanCaptcha(): void
    {
        $key = Hash::make('abcd');
        Cache::put('captcha_'.md5($key), true, 60);
        $this->withSession(['captcha' => ['sensitive' => false, 'key' => $key, 'encrypt' => false]]);
    }

    /** @return array<string, mixed> */
    private function dataAduan(array $override = []): array
    {
        return $override + ['nama_pelapor' => 'Budi', 'lokasi_kejadian' => 'Dusun I', 'isi_pengaduan' => 'Jalan rusak', 'captcha' => 'abcd'];
    }

    private function buatAduan(string $isi = 'Jalan rusak'): PengaduanMasyarakat
    {
        return PengaduanMasyarakat::create([
            'kode_tiket' => 'ADU-2026-TEST', 'nama_pelapor' => 'Budi', 'kontak_pelapor' => '08123456789',
            'lokasi_kejadian' => 'Dusun I', 'isi_pengaduan' => $isi,
        ]);
    }

    public function test_tamu_tidak_bisa_menyisipkan_kolom_internal_pengaduan(): void
    {
        $pemdes = User::factory()->role('pemdes')->create();
        $this->siapkanCaptcha();

        $this->post(route('pengaduan.store'), $this->dataAduan([
            'status_pengaduan' => 'Selesai', 'tanggapan_pemdes' => 'Palsu', 'ditanggapi_oleh' => $pemdes->id, 'kode_tiket' => 'ADU-2026-HACK',
        ]))->assertRedirect();

        $aduan = PengaduanMasyarakat::firstOrFail();
        $this->assertSame('Menunggu', $aduan->status_pengaduan);
        $this->assertNull($aduan->tanggapan_pemdes);
        $this->assertNull($aduan->ditanggapi_oleh);
        $this->assertNotSame('ADU-2026-HACK', $aduan->kode_tiket);
    }

    public function test_berkas_php_yang_diganti_ekstensi_jpg_ditolak(): void
    {
        $this->siapkanCaptcha();
        // Berkas nyata (bukan fake) agar MIME dideteksi dari isi berkas seperti saat upload sungguhan.
        $path = tempnam(sys_get_temp_dir(), 'shell');
        file_put_contents($path, '<?php echo shell_exec("whoami"); ?>');
        $palsu = new UploadedFile($path, 'shell.jpg', 'image/jpeg', null, true);

        $this->post(route('pengaduan.store'), $this->dataAduan(['foto_bukti' => $palsu]))->assertSessionHasErrors('foto_bukti');
        $this->assertSame(0, PengaduanMasyarakat::count());
    }

    public function test_tamu_dan_role_lain_tidak_bisa_melihat_data_pelapor(): void
    {
        $aduan = $this->buatAduan();

        $this->get(route('pemdes.pengaduan.show', $aduan))->assertRedirect(route('login'));
        foreach (['pelaksana', 'admin'] as $role) {
            $this->actingAs(User::factory()->role($role)->create())->get(route('pemdes.pengaduan.show', $aduan))->assertForbidden();
        }
    }

    public function test_rute_internal_tertutup_untuk_tamu(): void
    {
        foreach (['pemdes.dashboard', 'pemdes.rekap.pdf', 'pelaksana.dashboard', 'admin.dashboard', 'admin.audit.index', 'admin.backup.index'] as $rute) {
            $this->get(route($rute))->assertRedirect(route('login'));
        }
    }

    public function test_skrip_pada_isi_pengaduan_di_escape_di_respons_html(): void
    {
        $aduan = $this->buatAduan('<script>alert(1)</script>');
        $pemdes = User::factory()->role('pemdes')->create();

        $this->actingAs($pemdes)->get(route('pemdes.pengaduan.show', $aduan))
            ->assertOk()->assertDontSee('<script>alert(1)</script>', false);
    }
}
