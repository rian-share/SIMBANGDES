<?php

namespace App\Console\Commands;

use App\Models\Proyek;
use Illuminate\Console\Command;

class SinkronStatusProyek extends Command
{
    protected $signature = 'proyek:sinkron-status';

    protected $description = 'Sinkronkan status proyek: Perencanaan ke Berjalan, Berjalan ke Terlambat';

    public function handle(): int
    {
        $hariIni = now()->toDateString();

        $dimulai = Proyek::where('status_proyek', 'Perencanaan')
            ->whereDate('tanggal_mulai', '<=', $hariIni)
            ->update(['status_proyek' => 'Berjalan']);

        $terlambat = Proyek::where('status_proyek', 'Berjalan')
            ->whereDate('tanggal_selesai', '<', $hariIni)
            ->whereColumn('progres_aktual', '<', 'target_progres')
            ->update(['status_proyek' => 'Terlambat']);

        $this->info("Dimulai: $dimulai, Terlambat: $terlambat");

        return self::SUCCESS;
    }
}
