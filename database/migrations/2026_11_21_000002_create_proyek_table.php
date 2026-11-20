<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proyek', function (Blueprint $table) {
            $table->id();
            $table->string('nama_proyek', 150);
            $table->string('kategori', 100)->nullable();
            $table->string('lokasi', 200);
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->foreignId('pelaksana_id')->constrained('users')->restrictOnDelete();
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai')->index();
            $table->decimal('progres_aktual', 5, 2)->default(0);
            $table->decimal('target_progres', 5, 2)->default(100);
            $table->enum('status_proyek', ['Perencanaan', 'Berjalan', 'Terlambat', 'Selesai'])->default('Perencanaan')->index();
            $table->boolean('is_public')->default(true)->index();
            $table->text('deskripsi')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proyek');
    }
};
