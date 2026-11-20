<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rab_komponen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('anggaran_id')->constrained('anggaran')->cascadeOnDelete();
            $table->string('nama_komponen', 100);
            $table->decimal('nominal_rencana', 15, 2);
            $table->timestamps();
            $table->unique(['anggaran_id', 'nama_komponen']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rab_komponen');
    }
};
