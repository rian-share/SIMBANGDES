<?php

namespace Database\Seeders;

use App\Models\Anggaran;
use App\Models\DokumentasiFoto;
use App\Models\LaporanProgres;
use App\Models\LogAktivitas;
use App\Models\PengaduanMasyarakat;
use App\Models\Proyek;
use App\Models\RabKomponen;
use App\Models\User;
use App\Services\KalkulasiAnggaranService;
use App\Services\TiketPengaduanService;
use Carbon\CarbonInterface;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $akun = $this->seedAkun();
        $this->seedProyek($akun);
        $this->seedPengaduan($akun['pemdes']);
        $this->call(BeritaSeeder::class);
    }

    /** @return array<string, User> */
    private function seedAkun(): array
    {
        // Password "password" hanya untuk lingkungan lokal/demo.
        $data = [
            'admin' => ['Administrator Sistem', 'admin', true],
            'pemdes' => ['Kepala Desa', 'pemdes', true],
            'pelaksana' => ['TPK Dusun I', 'pelaksana', true],
            'pelaksana2' => ['CV Karya Desa', 'pelaksana', true],
            'nonaktif' => ['Pelaksana Nonaktif', 'pelaksana', false],
        ];

        $akun = [];
        foreach ($data as $username => [$nama, $role, $aktif]) {
            $akun[$username] = User::create([
                'nama_lengkap' => $nama,
                'username' => $username,
                'email' => "$username@simbangdes.test",
                'password' => 'password',
                'role' => $role,
                'status_aktif' => $aktif,
            ]);
        }

        return $akun;
    }

    /** @param array<string, User> $akun */
    private function seedProyek(array $akun): void
    {
        $service = new KalkulasiAnggaranService;
        $tahun = (int) now()->format('Y');

        // [nama, kategori, pelaksana, mulai(hari), selesai(hari), progres, status, is_public, pagu, [transaksi], laporan, dokumentasi?]
        $daftar = [
            ['Pembangunan Jalan Usaha Tani', 'Infrastruktur', 'pelaksana', -60, 30, '65.00', 'Berjalan', true, '150000000.00', [['Material', '25000000.00'], ['Material', '20000000.00'], ['Tenaga Kerja', '28000000.00'], ['Transportasi', '12000000.00']], 'Disetujui', true],
            ['Drainase Dusun II', 'Infrastruktur', 'pelaksana', -50, 10, '55.00', 'Berjalan', true, '80000000.00', [['Material', '30000000.00'], ['Tenaga Kerja', '25000000.00']], 'Menunggu', true],
            ['Rehab Posyandu', 'Kesehatan', 'pelaksana2', -90, -5, '70.00', 'Terlambat', true, '60000000.00', [['Material', '32000000.00'], ['Tenaga Kerja', '20000000.00'], ['Lain-lain', '8000000.00']], 'Ditolak', true],
            ['Sumur Bor Air Bersih', 'Sanitasi', 'pelaksana2', -120, -30, '100.00', 'Selesai', true, '45000000.00', [['Material', '20000000.00'], ['Peralatan', '24000000.00']], 'Disetujui', true],
            ['Gapura Desa', 'Fasilitas Umum', 'pelaksana', 10, 70, '0.00', 'Perencanaan', true, '25000000.00', [], null, false],
            ['Renovasi Kantor Desa', 'Fasilitas Umum', 'pelaksana2', -30, 60, '20.00', 'Berjalan', false, '90000000.00', [['Material', '15000000.00']], 'Disetujui', true],
        ];

        // Rencana komponen RAB per proyek (indeks sama dengan $daftar); total ≤ pagu.
        $rencana = [
            ['Material' => '40000000.00', 'Tenaga Kerja' => '30000000.00', 'Transportasi' => '10000000.00', 'Peralatan' => '40000000.00', 'Lain-lain' => '30000000.00'],
            ['Material' => '35000000.00', 'Tenaga Kerja' => '30000000.00', 'Transportasi' => '5000000.00', 'Peralatan' => '10000000.00'],
            ['Material' => '30000000.00', 'Tenaga Kerja' => '20000000.00', 'Transportasi' => '5000000.00', 'Lain-lain' => '5000000.00'],
            ['Material' => '20000000.00', 'Tenaga Kerja' => '15000000.00', 'Transportasi' => '5000000.00', 'Peralatan' => '5000000.00'],
            ['Material' => '15000000.00', 'Tenaga Kerja' => '8000000.00', 'Transportasi' => '2000000.00'],
            ['Material' => '50000000.00', 'Tenaga Kerja' => '30000000.00', 'Transportasi' => '10000000.00'],
        ];

        $lat = -8.58;
        $lng = 116.10;

        foreach ($daftar as $i => [$nama, $kategori, $pelaksana, $mulai, $selesai, $progres, $status, $publik, $pagu, $transaksi, $statusLaporan, $dokumentasi]) {
            $proyek = Proyek::create([
                'nama_proyek' => $nama,
                'kategori' => $kategori,
                'lokasi' => 'Dusun '.($i + 1).', Desa Contoh',
                'latitude' => $lat + $i * 0.004,
                'longitude' => $lng + $i * 0.005,
                'pelaksana_id' => $akun[$pelaksana]->id,
                'tanggal_mulai' => now()->addDays($mulai)->toDateString(),
                'tanggal_selesai' => now()->addDays($selesai)->toDateString(),
                'progres_aktual' => $progres,
                'target_progres' => '100.00',
                'status_proyek' => $status,
                'is_public' => $publik,
                'deskripsi' => "Simulasi proyek $nama untuk keperluan demonstrasi sistem.",
            ]);

            $anggaran = Anggaran::create([
                'proyek_id' => $proyek->id,
                'tahun_anggaran' => $tahun,
                'sumber_dana' => $i % 2 === 0 ? 'Dana Desa' : 'ADD',
                'pagu_anggaran' => $pagu,
            ]);
            $anggaran->forceFill(['sisa_anggaran' => $pagu])->save();

            $komponen = [];
            foreach ($rencana[$i] as $namaKomponen => $nominalRencana) {
                $komponen[$namaKomponen] = RabKomponen::create([
                    'anggaran_id' => $anggaran->id,
                    'nama_komponen' => $namaKomponen,
                    'nominal_rencana' => $nominalRencana,
                ]);
            }

            $mulaiTgl = now()->addDays($mulai)->startOfDay();
            $pemdes = $akun['pemdes'];
            $this->catatRiwayat($proyek, $pemdes, "Create Proyek #{$proyek->id}: $nama", $mulaiTgl->copy()->subDays(7)->setTime(10, 20));
            $this->catatRiwayat($proyek, $pemdes, "Create Anggaran #{$anggaran->id}: proyek #{$proyek->id}", $mulaiTgl->copy()->subDays(7)->setTime(10, 40));
            foreach ($komponen as $k) {
                $this->catatRiwayat($proyek, $pemdes, "Create RabKomponen #{$k->id}: {$k->nama_komponen} ({$this->rupiah($k->nominal_rencana)})", $mulaiTgl->copy()->subDays(7)->setTime(11, 5));
            }
            $this->catatRiwayat($proyek, $pemdes, "Update Proyek #{$proyek->id}: $nama — pelaksana: {$akun[$pelaksana]->nama_lengkap}", $mulaiTgl->copy()->subDays(7)->setTime(14, 30));

            foreach ($transaksi as $j => [$namaKomponen, $nominal]) {
                $tanggal = now()->addDays(min($mulai + 5 + $j * 7, -1))->startOfDay();
                $uraian = "$namaKomponen tahap ".($j + 1);
                $trx = $service->simpanTransaksi($anggaran, [
                    'rab_komponen_id' => $komponen[$namaKomponen]->id,
                    'tanggal_transaksi' => $tanggal->toDateString(),
                    'uraian' => $uraian,
                    'nominal' => $nominal,
                    'created_by' => $pemdes->id,
                ]);
                $this->catatRiwayat($proyek, $pemdes, "Create TransaksiPengeluaran #{$trx->id}: $uraian ({$this->rupiah($nominal)})", $tanggal->copy()->setTime(9, 0));
            }

            if ($statusLaporan) {
                $laporan = $this->seedLaporan($proyek, $akun, $progres, $statusLaporan, $dokumentasi);
                $this->catatRiwayat($proyek, $akun[$pelaksana], "Create LaporanProgres #{$laporan->id}: proyek #{$proyek->id} ({$laporan->persentase_fisik}%)", $laporan->tanggal_laporan->copy()->setTime(8, 15));
                if ($statusLaporan !== 'Menunggu') {
                    $this->catatRiwayat($proyek, $pemdes, "Update LaporanProgres #{$laporan->id}: proyek #{$proyek->id} ({$laporan->persentase_fisik}%) — $statusLaporan", $laporan->verified_at);
                }
            }
        }
    }

    /** Insert-only ke audit trail; created_at diisi manual agar riwayat simulasi kronologis. */
    private function catatRiwayat(Proyek $proyek, User $user, string $aktivitas, CarbonInterface $waktu): void
    {
        (new LogAktivitas)->forceFill([
            'user_id' => $user->id,
            'proyek_id' => $proyek->id,
            'aktivitas' => mb_substr($aktivitas, 0, 255),
            'ip_address' => '127.0.0.1',
            'created_at' => $waktu,
        ])->save();
    }

    private function rupiah(string $nominal): string
    {
        return 'Rp '.number_format((float) $nominal, 0, ',', '.');
    }

    /** @param array<string, User> $akun */
    private function seedLaporan(Proyek $proyek, array $akun, string $progres, string $status, bool $dokumentasi): LaporanProgres
    {
        $laporan = new LaporanProgres([
            'proyek_id' => $proyek->id,
            'pelaksana_id' => $proyek->pelaksana_id,
            'tanggal_laporan' => now()->subDays(3)->toDateString(),
            'persentase_fisik' => $status === 'Disetujui' ? $progres : bcadd($progres, '10', 2),
            'keterangan' => 'Pekerjaan berjalan sesuai rencana kerja mingguan.',
            'kendala' => $status === 'Ditolak' ? 'Cuaca buruk menghambat pekerjaan.' : null,
        ]);
        $laporan->status_verifikasi = $status;
        if ($status === 'Disetujui') {
            $laporan->verified_by = $akun['pemdes']->id;
            $laporan->verified_at = now()->subDays(2);
        }
        if ($status === 'Ditolak') {
            $laporan->catatan_revisi = 'Foto tahap Saat kurang jelas, mohon unggah ulang dan lengkapi foto tahap Sebelum.';
            $laporan->verified_by = $akun['pemdes']->id;
            $laporan->verified_at = now()->subDays(1);
        }
        $laporan->save();

        // Laporan Disetujui di proyek Selesai punya galeri lengkap 3 tahap; lainnya 1-2 foto.
        $tahap = $proyek->status_proyek === 'Selesai' ? ['Sebelum', 'Saat', 'Sesudah'] : ['Sebelum', 'Saat'];
        foreach ($dokumentasi ? $tahap : [] as $t) {
            DokumentasiFoto::create([
                'laporan_id' => $laporan->id,
                'proyek_id' => $proyek->id,
                'tahap' => $t,
                'file_path' => self::buatFotoPlaceholder($proyek->nama_proyek, $t),
            ]);
        }

        return $laporan;
    }

    public static function buatFotoPlaceholder(string $judul, string $tahap, string $folder = 'dokumentasi', int $lebar = 800, int $tinggi = 600): string
    {
        $img = imagecreatetruecolor($lebar, $tinggi);
        imagefill($img, 0, 0, imagecolorallocate($img, 226, 232, 240));
        imagefilledrectangle($img, 0, 0, $lebar, 90, imagecolorallocate($img, 185, 28, 28));
        $teks = imagecolorallocate($img, 255, 255, 255);
        imagestring($img, 5, 20, 35, 'SIMBANGDES - '.($folder === 'berita' ? 'Berita' : 'Dokumentasi').' '.$tahap, $teks);
        imagestring($img, 4, 20, (int) ($tinggi / 2), mb_substr($judul, 0, 60), imagecolorallocate($img, 30, 41, 59));

        ob_start();
        imagewebp($img, null, 80);
        $path = $folder.'/'.Str::uuid().'.webp';
        Storage::disk('public')->put($path, ob_get_clean());

        return $path;
    }

    private function seedPengaduan(User $pemdes): void
    {
        $tiket = new TiketPengaduanService;
        $proyekId = Proyek::publik()->value('id');

        $data = [
            ['Budi Santoso', 'Jalan di Dusun I berlubang dan membahayakan pengendara.', 'Menunggu', null],
            ['Siti Aminah', 'Drainase tersumbat dan menyebabkan genangan saat hujan.', 'Diproses', 'Pengaduan sedang ditinjau oleh tim di lapangan.'],
            ['Made Wirawan', 'Papan informasi proyek tidak terpasang di lokasi.', 'Selesai', 'Papan informasi sudah dipasang pada minggu ini. Terima kasih atas laporannya.'],
        ];

        foreach ($data as [$nama, $isi, $status, $tanggapan]) {
            $pengaduan = new PengaduanMasyarakat([
                'kode_tiket' => $tiket->generate(),
                'proyek_id' => $proyekId,
                'nama_pelapor' => $nama,
                'kontak_pelapor' => '08123456789',
                'lokasi_kejadian' => 'Desa Contoh',
                'isi_pengaduan' => $isi,
            ]);
            $pengaduan->status_pengaduan = $status;
            $pengaduan->tanggapan_pemdes = $tanggapan;
            $pengaduan->ditanggapi_oleh = $tanggapan ? $pemdes->id : null;
            $pengaduan->save();
        }
    }
}
