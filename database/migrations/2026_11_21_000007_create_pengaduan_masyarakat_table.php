<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengaduan_masyarakat', function (Blueprint $table) {
            $table->id();
            $table->string('kode_tiket', 20)->unique();
            $table->foreignId('proyek_id')->nullable()->constrained('proyek')->nullOnDelete();
            $table->string('nama_pelapor', 100);
            $table->string('kontak_pelapor', 50)->nullable();
            $table->string('lokasi_kejadian', 200);
            $table->text('isi_pengaduan');
            $table->string('foto_bukti', 255)->nullable();
            $table->enum('status_pengaduan', ['Menunggu', 'Diproses', 'Selesai', 'Ditolak'])->default('Menunggu')->index();
            $table->text('tanggapan_pemdes')->nullable();
            $table->foreignId('ditanggapi_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengaduan_masyarakat');
    }
};
