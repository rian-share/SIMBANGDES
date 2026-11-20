<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dokumentasi_foto', function (Blueprint $table) {
            $table->id();
            $table->foreignId('laporan_id')->constrained('laporan_progres')->cascadeOnDelete();
            $table->foreignId('proyek_id')->constrained('proyek')->cascadeOnDelete();
            $table->enum('tahap', ['Sebelum', 'Saat', 'Sesudah'])->index();
            $table->string('file_path', 255);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dokumentasi_foto');
    }
};
