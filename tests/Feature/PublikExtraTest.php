<?php

namespace Tests\Feature;

use App\Models\Anggaran;
use App\Models\BeritaPengumuman;
use App\Models\DokumentasiFoto;
use App\Models\LaporanProgres;
use App\Models\LogAktivitas;
use App\Models\PengaduanMasyarakat;
use App\Models\Proyek;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Statistik, Berita & Pengumuman, Galeri (publik) serta CRUD Berita oleh Pemdes. */
class PublikExtraTest extends TestCase
{
    use RefreshDatabase;

    private User $pemdes;

    private Proyek $publik;

    private Proyek $internal;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Storage::fake('public');
        $this->pemdes = User::factory()->role('pemdes')->create();
        $pelaksana = User::factory()->create();
        $this->publik = $this->buatProyek($pelaksana, 'Jalan Publik', true, 'Jalan', 'Selesai');
        $this->internal = $this->buatProyek($pelaksana, 'Rahasia Internal', false, 'Gedung', 'Terlambat');
    }

    private function buatProyek(User $pelaksana, string $nama, bool $publik, string $kategori, string $status): Proyek
    {
        $proyek = Proyek::create([
            'nama_proyek' => $nama, 'kategori' => $kategori, 'lokasi' => 'Dusun I', 'pelaksana_id' => $pelaksana->id,
            'is_public' => $publik, 'status_proyek' => $status,
            'tanggal_mulai' => now()->subDays(5)->toDateString(), 'tanggal_selesai' => now()->addDays(30)->toDateString(),
        ]);
        Anggaran::create(['proyek_id' => $proyek->id, 'tahun_anggaran' => 2026, 'sumber_dana' => 'DD', 'pagu_anggaran' => 1000]);

        return $proyek;
    }

    private function buatFoto(Proyek $proyek, string $statusLaporan, string $tahap, string $file): void
    {
        $laporan = LaporanProgres::create([
            'proyek_id' => $proyek->id, 'pelaksana_id' => $proyek->pelaksana_id, 'tanggal_laporan' => now()->toDateString(),
            'persentase_fisik' => 10, 'keterangan' => 'rahasia keterangan',
        ]);
        $laporan->forceFill(['status_verifikasi' => $statusLaporan])->save();
        DokumentasiFoto::create(['laporan_id' => $laporan->id, 'proyek_id' => $proyek->id, 'tahap' => $tahap, 'file_path' => $file]);
    }

    /** @return array<string, mixed> */
    private function dataBerita(array $override = []): array
    {
        return $override + ['judul' => 'Musyawarah Desa 2027', 'kategori' => 'Pengumuman', 'ringkasan' => 'Ringkas.', 'konten' => 'Isi lengkap.', 'is_published' => true];
    }

    // --- Akses halaman publik ---

    public function test_halaman_publik_baru_dapat_diakses_guest_tanpa_error_lazy_loading(): void
    {
        $this->buatFoto($this->publik, 'Disetujui', 'Saat', 'a.webp');
        BeritaPengumuman::factory()->create();
        PengaduanMasyarakat::create(['kode_tiket' => 'ADU-1', 'proyek_id' => $this->publik->id, 'nama_pelapor' => 'A', 'lokasi_kejadian' => 'X', 'isi_pengaduan' => 'Y']);

        foreach (['statistik', 'berita.index', 'galeri', 'beranda'] as $rute) {
            $this->get(route($rute))->assertOk();
        }
    }

    public function test_statistik_hanya_menghitung_proyek_publik(): void
    {
        PengaduanMasyarakat::create(['kode_tiket' => 'ADU-1', 'proyek_id' => $this->publik->id, 'nama_pelapor' => 'A', 'lokasi_kejadian' => 'X', 'isi_pengaduan' => 'Y']);
        PengaduanMasyarakat::create(['kode_tiket' => 'ADU-2', 'proyek_id' => $this->internal->id, 'nama_pelapor' => 'B', 'lokasi_kejadian' => 'X', 'isi_pengaduan' => 'Y']);
        PengaduanMasyarakat::create(['kode_tiket' => 'ADU-3', 'proyek_id' => null, 'nama_pelapor' => 'C', 'lokasi_kejadian' => 'X', 'isi_pengaduan' => 'Y']);

        $this->get(route('statistik'))->assertInertia(fn (Assert $p) => $p
            ->component('Public/Statistik')
            ->where('ringkasan.jumlah_proyek', 1)
            ->where('status.Selesai', 1)
            ->where('status.Terlambat', 0)
            ->has('kategori', 1)->where('kategori.0.label', 'Jalan')
            ->where('uang.pagu', fn ($v) => (float) $v === 1000.0)
            ->has('tren', 1)
            ->where('pengaduan.total', 2));
    }

    // --- Berita publik ---

    public function test_berita_draf_dan_terjadwal_tidak_tampil_dan_mengembalikan_404(): void
    {
        $terbit = BeritaPengumuman::factory()->create(['judul' => 'Terbit']);
        $draf = BeritaPengumuman::factory()->draf()->create(['judul' => 'Draf']);
        $terjadwal = BeritaPengumuman::factory()->create(['published_at' => now()->addDay()]);

        $this->get(route('berita.index'))->assertInertia(fn (Assert $p) => $p->has('berita.data', 1)->where('berita.data.0.judul', 'Terbit'));
        $this->get(route('berita.show', $terbit->slug))->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('Public/Berita/Show')->where('berita.penulis', $terbit->penulis->nama_lengkap)->missing('berita.penulis_email'));
        $this->get(route('berita.show', $draf->slug))->assertNotFound();
        $this->get(route('berita.show', $terjadwal->slug))->assertNotFound();
    }

    public function test_berita_filter_kategori_dan_pencarian(): void
    {
        BeritaPengumuman::factory()->create(['judul' => 'Jalan Baru', 'kategori' => 'Berita']);
        BeritaPengumuman::factory()->create(['judul' => 'Rapat Warga', 'kategori' => 'Pengumuman']);

        $this->get(route('berita.index', ['kategori' => 'Pengumuman']))->assertInertia(fn (Assert $p) => $p->has('berita.data', 1)->where('berita.data.0.judul', 'Rapat Warga'));
        $this->get(route('berita.index', ['q' => 'Jalan']))->assertInertia(fn (Assert $p) => $p->has('berita.data', 1)->where('berita.data.0.judul', 'Jalan Baru'));
        $this->get(route('berita.index', ['kategori' => 'Lain']))->assertSessionHasErrors('kategori');
    }

    // --- Galeri ---

    public function test_galeri_hanya_foto_disetujui_dari_proyek_publik_dan_tidak_membocorkan_laporan(): void
    {
        $this->buatFoto($this->publik, 'Disetujui', 'Sebelum', 'ok.webp');
        $this->buatFoto($this->publik, 'Menunggu', 'Sebelum', 'menunggu.webp');
        $this->buatFoto($this->internal, 'Disetujui', 'Sebelum', 'internal.webp');

        $this->get(route('galeri'))->assertInertia(fn (Assert $p) => $p
            ->component('Public/Galeri')
            ->has('foto.data', 1)->where('foto.data.0.file_path', 'ok.webp')
            ->where('foto.data.0.tahun', 2026)
            ->missing('foto.data.0.laporan_id')
            ->has('opsi.proyek', 1));
    }

    public function test_galeri_filter_tahap_proyek_tahun_dan_validasi(): void
    {
        $this->buatFoto($this->publik, 'Disetujui', 'Sebelum', 'a.webp');
        $this->buatFoto($this->publik, 'Disetujui', 'Sesudah', 'b.webp');

        $this->get(route('galeri', ['tahap' => 'Sesudah']))->assertInertia(fn (Assert $p) => $p->has('foto.data', 1)->where('foto.data.0.file_path', 'b.webp'));
        $this->get(route('galeri', ['proyek' => $this->publik->id, 'tahun' => 2026]))->assertInertia(fn (Assert $p) => $p->has('foto.data', 2));
        $this->get(route('galeri', ['tahun' => 2020]))->assertInertia(fn (Assert $p) => $p->has('foto.data', 0));
        $this->get(route('galeri', ['proyek' => $this->internal->id]))->assertInertia(fn (Assert $p) => $p->has('foto.data', 0));
        $this->get(route('galeri', ['tahap' => 'xyz']))->assertSessionHasErrors('tahap');
    }

    // --- CRUD Pemdes ---

    public function test_pemdes_membuat_berita_dengan_cover_webp_slug_unik_dan_audit_log(): void
    {
        $data = $this->dataBerita(['gambar_cover' => UploadedFile::fake()->image('c.jpg', 2000, 1000)]);

        $this->actingAs($this->pemdes)->post(route('pemdes.berita.store'), $data)->assertRedirect(route('pemdes.berita.index'));
        $this->actingAs($this->pemdes)->post(route('pemdes.berita.store'), $this->dataBerita());

        $pertama = BeritaPengumuman::orderBy('id')->first();
        $this->assertSame('musyawarah-desa-2027', $pertama->slug);
        $this->assertSame('musyawarah-desa-2027-2', BeritaPengumuman::orderByDesc('id')->first()->slug);
        $this->assertSame($this->pemdes->id, $pertama->user_id);
        $this->assertNotNull($pertama->published_at);
        $this->assertStringEndsWith('.webp', $pertama->gambar_cover);
        Storage::disk('public')->assertExists($pertama->gambar_cover);
        $this->assertTrue(LogAktivitas::where('aktivitas', "Create BeritaPengumuman #{$pertama->id}: Musyawarah Desa 2027")->exists());
    }

    public function test_pemdes_mengubah_berita_slug_tetap_cover_lama_terhapus_dan_toggle_publikasi(): void
    {
        $this->actingAs($this->pemdes)->post(route('pemdes.berita.store'), $this->dataBerita(['gambar_cover' => UploadedFile::fake()->image('a.jpg')]));
        $berita = BeritaPengumuman::first();
        $coverLama = $berita->gambar_cover;

        $this->actingAs($this->pemdes)->post(route('pemdes.berita.update', $berita), $this->dataBerita(['judul' => 'Judul Baru', 'is_published' => false, 'gambar_cover' => UploadedFile::fake()->image('b.jpg')]))
            ->assertRedirect(route('pemdes.berita.index'));

        $berita->refresh();
        $this->assertSame('musyawarah-desa-2027', $berita->slug);
        $this->assertSame('Judul Baru', $berita->judul);
        $this->assertFalse($berita->is_published);
        $this->assertNull($berita->published_at);
        Storage::disk('public')->assertMissing($coverLama);
        Storage::disk('public')->assertExists($berita->gambar_cover);

        $this->actingAs($this->pemdes)->post(route('pemdes.berita.update', $berita), $this->dataBerita(['is_published' => true]));
        $this->assertNotNull($berita->fresh()->published_at);
    }

    public function test_pemdes_menghapus_berita_beserta_cover(): void
    {
        $this->actingAs($this->pemdes)->post(route('pemdes.berita.store'), $this->dataBerita(['gambar_cover' => UploadedFile::fake()->image('a.jpg')]));
        $berita = BeritaPengumuman::first();

        $this->actingAs($this->pemdes)->delete(route('pemdes.berita.destroy', $berita))->assertRedirect(route('pemdes.berita.index'));

        $this->assertModelMissing($berita);
        Storage::disk('public')->assertMissing($berita->gambar_cover);
    }

    public function test_pemdes_index_berita_dan_form_dapat_dibuka(): void
    {
        $berita = BeritaPengumuman::factory()->create();

        $this->actingAs($this->pemdes)->get(route('pemdes.berita.index'))->assertInertia(fn (Assert $p) => $p->component('Pemdes/Berita/Index')->has('berita.data', 1));
        $this->actingAs($this->pemdes)->get(route('pemdes.berita.create'))->assertOk();
        $this->actingAs($this->pemdes)->get(route('pemdes.berita.edit', $berita))->assertInertia(fn (Assert $p) => $p->component('Pemdes/Berita/Form')->where('berita.id', $berita->id));
    }

    public function test_validasi_cover_dan_kategori_berita(): void
    {
        $this->actingAs($this->pemdes)->post(route('pemdes.berita.store'), $this->dataBerita(['gambar_cover' => UploadedFile::fake()->create('besar.jpg', 6000, 'image/jpeg')]))
            ->assertSessionHasErrors('gambar_cover');
        $this->actingAs($this->pemdes)->post(route('pemdes.berita.store'), $this->dataBerita(['gambar_cover' => UploadedFile::fake()->image('x.gif')]))
            ->assertSessionHasErrors('gambar_cover');
        $this->actingAs($this->pemdes)->post(route('pemdes.berita.store'), $this->dataBerita(['kategori' => 'Lain']))->assertSessionHasErrors('kategori');
        $this->assertSame(0, BeritaPengumuman::count());
    }

    public function test_role_lain_dan_guest_tidak_bisa_mengelola_berita(): void
    {
        $this->get(route('pemdes.berita.index'))->assertRedirect(route('login'));
        $this->actingAs(User::factory()->create())->get(route('pemdes.berita.index'))->assertForbidden();
        $this->actingAs(User::factory()->role('admin')->create())->post(route('pemdes.berita.store'), $this->dataBerita())->assertForbidden();
    }
}
