<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Sengaja tanpa FK: cascade/null-on-delete akan mengubah audit trail yang append-only.
    public function up(): void
    {
        Schema::table('log_aktivitas', function (Blueprint $table) {
            $table->unsignedBigInteger('proyek_id')->nullable()->after('user_id');
            $table->index(['proyek_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::table('log_aktivitas', function (Blueprint $table) {
            $table->dropIndex(['proyek_id', 'id']);
            $table->dropColumn('proyek_id');
        });
    }
};
