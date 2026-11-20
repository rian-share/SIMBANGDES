<?php

namespace Database\Seeders;

use App\Models\BeritaPengumuman;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class BeritaSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $pemdes = User::where('role', 'pemdes')->firstOrFail();

        $data = [
            ['Berita', 'Pembangunan Jalan Usaha Tani Capai 65 Persen', 'Pengerasan 1,2 km jalan menuju persawahan Dusun I memasuki tahap pemadatan dan ditargetkan rampung bulan depan.', 3, true,
                "Pembangunan Jalan Usaha Tani di Dusun I kini telah mencapai 65 persen. Pekerjaan pengerasan badan jalan sepanjang 1,2 kilometer memasuki tahap pemadatan.\n\nJalan ini menghubungkan permukiman dengan area persawahan sehingga petani dapat mengangkut hasil panen dengan lebih mudah dan murah.\n\nPelaksana menargetkan pekerjaan rampung bulan depan. Warga dapat memantau perkembangan proyek melalui Katalog Proyek di portal ini."],
            ['Pengumuman', 'Undangan Musyawarah Desa Penyusunan RKP Desa 2027', 'Warga diundang hadir di Balai Desa untuk membahas usulan prioritas pembangunan tahun depan.', 1, false,
                "Pemerintah Desa mengundang seluruh warga, tokoh masyarakat, dan perwakilan dusun untuk menghadiri Musyawarah Desa penyusunan Rencana Kerja Pemerintah Desa (RKP Desa) 2027.\n\nAcara berlangsung di Balai Desa pada hari Sabtu pukul 09.00 WITA. Mohon membawa usulan kegiatan yang telah disepakati di tingkat dusun.\n\nKehadiran Bapak/Ibu sangat berarti bagi arah pembangunan desa kita."],
            ['Berita', 'Sumur Bor Air Bersih Resmi Dimanfaatkan Warga', 'Sumur bor kedalaman 80 meter kini melayani sekitar 120 KK; pengelolaan diserahkan kepada BUMDes.', 20, true,
                "Sumur Bor Air Bersih yang dibangun dengan Dana Desa telah selesai 100 persen dan resmi dimanfaatkan warga.\n\nSumur dengan kedalaman 80 meter ini melayani sekitar 120 kepala keluarga di sekitar lokasi, sehingga warga tidak lagi bergantung pada sumber air musiman.\n\nPengelolaan selanjutnya diserahkan kepada BUMDes dengan iuran terjangkau untuk biaya perawatan pompa dan listrik."],
            ['Pengumuman', 'Penutupan Sementara Jalan Dusun II untuk Pekerjaan Drainase', 'Akses ditutup pukul 08.00–16.00 selama 7 hari; gunakan jalur alternatif melalui lapangan desa.', 6, false,
                "Sehubungan dengan pekerjaan Drainase Dusun II, ruas jalan utama dusun akan ditutup sementara setiap pukul 08.00 sampai 16.00 selama 7 hari.\n\nPengendara diminta menggunakan jalur alternatif melalui lapangan desa. Kendaraan darurat tetap dapat melintas dengan arahan petugas.\n\nMohon maaf atas ketidaknyamanan ini. Pekerjaan dilakukan demi mencegah genangan saat musim hujan."],
            ['Berita', 'Rencana Pembangunan Gapura Desa Dimulai Bulan Depan', 'Desain gapura telah disepakati; pekerjaan fisik dijadwalkan setelah pencairan Dana Desa tahap II.', 0, true,
                "Desain Gapura Desa telah disepakati bersama dalam musyawarah. Pekerjaan fisik dijadwalkan dimulai setelah pencairan Dana Desa tahap II.\n\nBerita ini masih berstatus draf dan belum ditampilkan kepada publik."],
        ];

        foreach ($data as $i => [$kategori, $judul, $ringkasan, $hariLalu, $punyaCover, $konten]) {
            $draf = $i === 4;
            BeritaPengumuman::create([
                'user_id' => $pemdes->id,
                'judul' => $judul,
                'slug' => BeritaPengumuman::buatSlug($judul),
                'kategori' => $kategori,
                'ringkasan' => $ringkasan,
                'konten' => $konten,
                'gambar_cover' => $punyaCover ? DatabaseSeeder::buatFotoPlaceholder($judul, $kategori, 'berita', 1200, 675) : null,
                'is_published' => ! $draf,
                'published_at' => $draf ? null : now()->subDays($hariLalu),
            ]);
        }
    }
}
