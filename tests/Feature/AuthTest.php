<?php

namespace Tests\Feature;

use App\Models\LogAktivitas;
use App\Models\Proyek;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use LogicException;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    private function user(string $role = 'pemdes', array $attrs = []): User
    {
        return User::factory()->role($role)->create($attrs);
    }

    public function test_login_dengan_email(): void
    {
        $user = $this->user('pemdes', ['email' => 'kades@desa.test']);

        $this->post('/login', ['login' => 'kades@desa.test', 'password' => 'password'])
            ->assertRedirect(route('pemdes.dashboard'));

        $this->assertAuthenticatedAs($user);
    }

    public function test_login_dengan_username_dan_redirect_sesuai_role(): void
    {
        $this->user('pelaksana', ['username' => 'tpk1']);

        $this->post('/login', ['login' => 'tpk1', 'password' => 'password'])
            ->assertRedirect(route('pelaksana.dashboard'));
    }

    public function test_kata_sandi_salah_ditolak(): void
    {
        $this->user('admin', ['username' => 'admin1']);

        $this->post('/login', ['login' => 'admin1', 'password' => 'salah'])
            ->assertSessionHasErrors('login');

        $this->assertGuest();
        $this->assertSame(0, LogAktivitas::count());
    }

    public function test_akun_nonaktif_ditolak_saat_login(): void
    {
        $this->user('pelaksana', ['username' => 'mati', 'status_aktif' => false]);

        $this->post('/login', ['login' => 'mati', 'password' => 'password'])
            ->assertSessionHasErrors('login');

        $this->assertGuest();
    }

    public function test_akun_dinonaktifkan_saat_sesi_berjalan_otomatis_keluar(): void
    {
        $user = $this->user('pemdes');

        $this->actingAs($user)->get('/pemdes/dashboard')->assertOk();

        $user->update(['status_aktif' => false]);

        $this->get('/pemdes/dashboard')
            ->assertRedirect(route('login'))
            ->assertSessionHas('error');

        $this->assertGuest();
        $this->assertDatabaseHas('log_aktivitas', ['user_id' => $user->id, 'aktivitas' => 'Logout (akun nonaktif)']);
    }

    public function test_login_dan_logout_tercatat_di_log_aktivitas(): void
    {
        $user = $this->user('admin', ['username' => 'adm']);

        $this->post('/login', ['login' => 'adm', 'password' => 'password']);
        $this->assertDatabaseHas('log_aktivitas', ['user_id' => $user->id, 'aktivitas' => 'Login']);

        $this->post('/logout')->assertRedirect(route('login'));
        $this->assertDatabaseHas('log_aktivitas', ['user_id' => $user->id, 'aktivitas' => 'Logout']);
        $this->assertGuest();
    }

    public function test_login_dibatasi_lima_percobaan_per_menit(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', ['login' => 'x', 'password' => 'y']);
        }

        $this->post('/login', ['login' => 'x', 'password' => 'y'])->assertStatus(429);
    }

    public function test_tamu_diarahkan_ke_login_untuk_halaman_internal(): void
    {
        $this->get('/pemdes/dashboard')->assertRedirect(route('login'));
        $this->get('/profil')->assertRedirect(route('login'));
    }

    public function test_pengguna_login_tidak_bisa_membuka_halaman_login(): void
    {
        $this->actingAs($this->user('admin'))->get('/login')->assertRedirect(route('admin.dashboard'));
    }

    public function test_role_dibatasi_antar_grup_rute(): void
    {
        $pelaksana = $this->user('pelaksana');

        $this->actingAs($pelaksana)->get('/pelaksana/dashboard')->assertOk();
        $this->actingAs($pelaksana)->get('/pemdes/dashboard')->assertForbidden();
        $this->actingAs($pelaksana)->get('/admin/dashboard')->assertForbidden();

        $this->actingAs($this->user('pemdes'))->get('/admin/dashboard')->assertForbidden();
        $this->actingAs($this->user('admin'))->get('/pelaksana/dashboard')->assertForbidden();
    }

    public function test_data_bersama_inertia_hanya_memuat_field_aman(): void
    {
        $user = $this->user('pemdes');

        $this->actingAs($user)->get('/pemdes/dashboard')->assertInertia(fn ($page) => $page
            ->where('auth.user.id', $user->id)
            ->where('auth.user.role', 'pemdes')
            ->missing('auth.user.password')
            ->has('flash'));
    }

    public function test_aksi_create_tercatat_oleh_audit_trail_observer(): void
    {
        $pemdes = $this->user('pemdes');
        $pelaksana = $this->user('pelaksana');

        $this->actingAs($pemdes);
        $proyek = Proyek::create([
            'nama_proyek' => 'Jalan Desa',
            'lokasi' => 'Dusun I',
            'pelaksana_id' => $pelaksana->id,
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonth()->toDateString(),
        ]);

        $this->assertDatabaseHas('log_aktivitas', [
            'user_id' => $pemdes->id,
            'aktivitas' => "Create Proyek #{$proyek->id}: Jalan Desa",
        ]);
    }

    public function test_audit_trail_read_only_dan_tanpa_rute_ubah_atau_hapus(): void
    {
        foreach (Route::getRoutes() as $route) {
            if (str_contains($route->uri(), 'audit') || str_contains($route->uri(), 'log-aktivitas')) {
                $this->assertSame(['GET', 'HEAD'], $route->methods());
            }
        }

        $log = LogAktivitas::create(['aktivitas' => 'uji']);

        try {
            $log->update(['aktivitas' => 'diubah']);
            $this->fail('Update harus ditolak.');
        } catch (LogicException) {
            $this->assertSame('uji', $log->fresh()->aktivitas);
        }

        $this->expectException(LogicException::class);
        $log->delete();
    }

    public function test_profil_dapat_diperbarui(): void
    {
        $user = $this->user('pelaksana');

        $this->actingAs($user)->patch('/profil', [
            'nama_lengkap' => 'Nama Baru',
            'email' => 'baru@desa.test',
        ])->assertSessionHas('success');

        $this->assertSame('Nama Baru', $user->fresh()->nama_lengkap);
    }
}
