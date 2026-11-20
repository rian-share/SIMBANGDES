<?php

namespace Tests\Feature;

use App\Models\Anggaran;
use App\Models\LaporanProgres;
use App\Models\LogAktivitas;
use App\Models\Proyek;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PelaksanaAdminTest extends TestCase
{
    use RefreshDatabase;

    private User $pelaksana;

    private User $lain;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Storage::fake('public');
        Storage::fake('local');
        $this->pelaksana = User::factory()->create();
        $this->lain = User::factory()->create();
        $this->admin = User::factory()->role('admin')->create();
    }

    private function buatProyek(User $milik, float $progres = 0): Proyek
    {
        $proyek = Proyek::create([
            'nama_proyek' => 'Proyek '.$milik->id, 'lokasi' => 'Dusun I', 'pelaksana_id' => $milik->id,
            'tanggal_mulai' => now()->subDays(5)->toDateString(), 'tanggal_selesai' => now()->addDays(30)->toDateString(),
            'progres_aktual' => $progres, 'status_proyek' => 'Berjalan',
        ]);
        Anggaran::create(['proyek_id' => $proyek->id, 'tahun_anggaran' => 2026, 'sumber_dana' => 'DD', 'pagu_anggaran' => 1000]);

        return $proyek;
    }

    /** @return array<string, mixed> */
    private function dataLaporan(array $override = []): array
    {
        return $override + [
            'persentase_fisik' => 30,
            'keterangan' => 'Pekerjaan pondasi',
            'foto' => ['Sebelum' => UploadedFile::fake()->image('a.jpg', 2400, 1800)],
        ];
    }

    public function test_dashboard_pelaksana_dan_admin_dirender(): void
    {
        $this->buatProyek($this->pelaksana);

        $this->actingAs($this->pelaksana)->get(route('pelaksana.dashboard'))
            ->assertInertia(fn (Assert $p) => $p->component('Pelaksana/Dashboard')->has('proyek', 1)->has('statusLaporan', 3));
        $this->actingAs($this->admin)->get(route('admin.dashboard'))
            ->assertInertia(fn (Assert $p) => $p->component('Admin/Dashboard')->has('loginHarian', 14)->has('userPerRole', 3));
    }

    public function test_pelaksana_tidak_bisa_melihat_atau_melapor_proyek_pelaksana_lain(): void
    {
        $milikLain = $this->buatProyek($this->lain);
        $this->actingAs($this->pelaksana);

        $this->get(route('pelaksana.proyek.show', $milikLain))->assertNotFound();
        $this->get(route('pelaksana.laporan.create', $milikLain))->assertNotFound();
        $this->post(route('pelaksana.laporan.store', $milikLain), $this->dataLaporan())->assertNotFound();
        $this->assertDatabaseCount('laporan_progres', 0);

        $this->get(route('pelaksana.proyek.index'))->assertInertia(fn (Assert $p) => $p->has('proyek', 0));
    }

    public function test_kirim_laporan_memproses_foto_menjadi_webp_terkompresi(): void
    {
        $proyek = $this->buatProyek($this->pelaksana);

        $this->actingAs($this->pelaksana)->post(route('pelaksana.laporan.store', $proyek), $this->dataLaporan())->assertSessionHasNoErrors();

        $foto = LaporanProgres::firstOrFail()->foto()->firstOrFail();
        $this->assertSame('Sebelum', $foto->tahap);
        $this->assertMatchesRegularExpression('#^dokumentasi/[0-9a-f-]{36}\.webp$#', $foto->file_path);
        Storage::disk('public')->assertExists($foto->file_path);
        $this->assertLessThanOrEqual(1600, getimagesizefromstring(Storage::disk('public')->get($foto->file_path))[0]);
    }

    public function test_laporan_kedua_saat_masih_menunggu_diblokir(): void
    {
        $proyek = $this->buatProyek($this->pelaksana);
        $this->actingAs($this->pelaksana);

        $this->post(route('pelaksana.laporan.store', $proyek), $this->dataLaporan())->assertSessionHasNoErrors();
        $this->post(route('pelaksana.laporan.store', $proyek), $this->dataLaporan(['persentase_fisik' => 50]))->assertSessionHasErrors('persentase_fisik');

        $this->assertDatabaseCount('laporan_progres', 1);
        $this->assertDatabaseCount('dokumentasi_foto', 1);
    }

    public function test_validasi_laporan_dan_foto(): void
    {
        $proyek = $this->buatProyek($this->pelaksana, 40);
        $this->actingAs($this->pelaksana);

        $this->post(route('pelaksana.laporan.store', $proyek), $this->dataLaporan(['persentase_fisik' => 39]))->assertSessionHasErrors('persentase_fisik');
        $this->post(route('pelaksana.laporan.store', $proyek), $this->dataLaporan(['persentase_fisik' => 101]))->assertSessionHasErrors('persentase_fisik');
        $this->post(route('pelaksana.laporan.store', $proyek), $this->dataLaporan(['foto' => []]))->assertSessionHasErrors('foto');
        $this->post(route('pelaksana.laporan.store', $proyek), $this->dataLaporan(['foto' => ['Saat' => UploadedFile::fake()->image('b.jpg')->size(5121)]]))->assertSessionHasErrors('foto.Saat');
        $this->post(route('pelaksana.laporan.store', $proyek), $this->dataLaporan(['foto' => ['Saat' => UploadedFile::fake()->create('c.pdf', 10, 'application/pdf')]]))->assertSessionHasErrors('foto.Saat');

        $this->assertDatabaseCount('laporan_progres', 0);
    }

    public function test_revisi_laporan_ditolak_mengganti_foto_dan_kembali_menunggu(): void
    {
        $proyek = $this->buatProyek($this->pelaksana);
        $this->actingAs($this->pelaksana)->post(route('pelaksana.laporan.store', $proyek), $this->dataLaporan());
        $laporan = LaporanProgres::firstOrFail();
        $fotoLama = $laporan->foto()->firstOrFail();

        // Laporan Menunggu tidak bisa direvisi.
        $this->get(route('pelaksana.laporan.edit', $laporan))->assertForbidden();

        $laporan->forceFill(['status_verifikasi' => 'Ditolak', 'catatan_revisi' => 'Foto kurang jelas'])->save();
        $this->get(route('pelaksana.laporan.edit', $laporan))->assertInertia(fn (Assert $p) => $p->where('laporan.catatan_revisi', 'Foto kurang jelas'));

        $this->post(route('pelaksana.laporan.update', $laporan), ['persentase_fisik' => 35, 'keterangan' => 'Diperbaiki', 'foto' => ['Sebelum' => UploadedFile::fake()->image('baru.png')]])
            ->assertSessionHasNoErrors();

        $laporan->refresh();
        $this->assertSame('Menunggu', $laporan->status_verifikasi);
        $this->assertSame('Foto kurang jelas', $laporan->catatan_revisi);
        $this->assertSame('35.00', $laporan->persentase_fisik);
        Storage::disk('public')->assertMissing($fotoLama->file_path);
        $this->assertSame(1, $laporan->foto()->count());

        // Laporan milik pelaksana lain: 404.
        $this->actingAs($this->lain)->get(route('pelaksana.laporan.edit', $laporan))->assertNotFound();
    }

    public function test_revisi_tidak_boleh_menghapus_semua_foto(): void
    {
        $proyek = $this->buatProyek($this->pelaksana);
        $this->actingAs($this->pelaksana)->post(route('pelaksana.laporan.store', $proyek), $this->dataLaporan());
        $laporan = LaporanProgres::firstOrFail();
        $laporan->forceFill(['status_verifikasi' => 'Ditolak', 'catatan_revisi' => 'Perbaiki'])->save();

        $this->post(route('pelaksana.laporan.update', $laporan), ['persentase_fisik' => 30, 'keterangan' => 'x', 'hapus_foto' => [$laporan->foto()->first()->id]])
            ->assertSessionHasErrors('foto');
        $this->assertSame(1, $laporan->foto()->count());
    }

    public function test_admin_kelola_user_dan_toggle_status(): void
    {
        $this->actingAs($this->admin);

        $this->post(route('admin.users.store'), [
            'nama_lengkap' => 'Budi', 'username' => 'budi', 'email' => 'budi@example.com', 'role' => 'pemdes',
            'password' => 'rahasia123', 'password_confirmation' => 'rahasia123',
        ])->assertRedirect(route('admin.users.index'));
        $budi = User::where('username', 'budi')->firstOrFail();
        $this->assertTrue($budi->status_aktif);

        $this->patch(route('admin.users.status', $budi))->assertSessionHas('success');
        $this->assertFalse($budi->fresh()->status_aktif);

        $this->patch(route('admin.users.status', $this->admin))->assertSessionHas('error');
        $this->assertTrue($this->admin->fresh()->status_aktif);

        $this->post(route('admin.users.reset-password', $budi), ['password' => 'baru12345', 'password_confirmation' => 'baru12345'])->assertSessionHasNoErrors();
        $this->assertTrue(\Hash::check('baru12345', $budi->fresh()->password));

        $this->post(route('admin.users.store'), ['nama_lengkap' => 'X', 'username' => 'budi', 'email' => 'x@example.com', 'role' => 'superuser', 'password' => 'abc', 'password_confirmation' => 'abc'])
            ->assertSessionHasErrors(['username', 'role', 'password']);

        $this->actingAs($this->pelaksana)->get(route('admin.users.index'))->assertForbidden();
    }

    public function test_audit_trail_read_only_dan_bisa_difilter(): void
    {
        $this->actingAs($this->admin);
        LogAktivitas::catat('Login');
        LogAktivitas::catat('Create Proyek #1: Jalan');

        $this->get(route('admin.audit.index', ['jenis' => 'Create']))->assertInertia(fn (Assert $p) => $p->component('Admin/Audit/Index')->has('log.data', 1));
        $this->get(route('admin.audit.index', ['jenis' => 'Hack']))->assertSessionHasErrors('jenis');

        foreach (Route::getRoutes() as $rute) {
            if (str_contains($rute->uri(), 'audit')) {
                $this->assertSame(['GET', 'HEAD'], $rute->methods(), "Rute {$rute->uri()} tidak boleh mengubah log");
            }
        }
        $this->expectException(\LogicException::class);
        LogAktivitas::latest('id')->firstOrFail()->delete();
    }

    public function test_backup_database_dan_unduh(): void
    {
        Process::fake(function ($proses) {
            Storage::disk('local')->put('backups/'.now()->format('Y-m-d_His').'.sql', '-- dump');

            return Process::result('');
        });
        $this->actingAs($this->admin)->post(route('admin.backup.store'))->assertSessionHas('success');

        $nama = basename(Storage::disk('local')->files('backups')[0]);
        $this->get(route('admin.backup.index'))->assertInertia(fn (Assert $p) => $p->has('berkas', 1));
        $this->get(route('admin.backup.download', $nama))->assertOk();
        $this->get(route('admin.backup.download', '..%2F.env'))->assertNotFound();
        $this->assertDatabaseHas('log_aktivitas', ['aktivitas' => "Download Backup: $nama"]);

        $this->actingAs($this->pelaksana)->post(route('admin.backup.store'))->assertForbidden();
    }
}
