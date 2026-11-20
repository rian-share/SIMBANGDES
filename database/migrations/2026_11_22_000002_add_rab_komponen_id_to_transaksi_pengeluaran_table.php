<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transaksi_pengeluaran', function (Blueprint $table) {
            $table->foreignId('rab_komponen_id')->nullable()->after('anggaran_id')
                ->constrained('rab_komponen')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('transaksi_pengeluaran', function (Blueprint $table) {
            $table->dropConstrainedForeignId('rab_komponen_id');
        });
    }
};
