<?php

namespace App\Services;

use App\Models\Proyek;
use Carbon\CarbonInterface;

class AnalisisRisikoService
{
    /** BR-PRG 2.1: target jadwal berjalan, di-clamp 0..target_progres. */
    public function targetBerjalan(Proyek $proyek, ?CarbonInterface $hariIni = null): float
    {
        $kini = ($hariIni ?? now())->copy()->startOfDay();
        $mulai = $proyek->tanggal_mulai->copy()->startOfDay();
        $selesai = $proyek->tanggal_selesai->copy()->startOfDay();
        $target = (float) $proyek->target_progres;

        $durasi = $mulai->diffInDays($selesai, false);
        if ($durasi <= 0) {
            return $kini->greaterThanOrEqualTo($selesai) ? $target : 0.0;
        }

        $rasio = $mulai->diffInDays($kini, false) / $durasi;

        return round(max(0.0, min($target, $rasio * $target)), 2);
    }

    public function deviasi(Proyek $proyek, ?CarbonInterface $hariIni = null): float
    {
        return round((float) $proyek->progres_aktual - $this->targetBerjalan($proyek, $hariIni), 2);
    }

    /** BR-PRG 2.2: Aman | Waspada | Kritis. */
    public function levelRisiko(Proyek $proyek, ?CarbonInterface $hariIni = null): string
    {
        if ($proyek->status_proyek === 'Selesai') {
            return 'Aman';
        }

        $kini = ($hariIni ?? now())->copy()->startOfDay();
        $deviasi = $this->deviasi($proyek, $kini);
        $lewatTenggat = $kini->greaterThan($proyek->tanggal_selesai->copy()->startOfDay())
            && (float) $proyek->progres_aktual < (float) $proyek->target_progres;

        return match (true) {
            $deviasi < -15.00 || $lewatTenggat => 'Kritis',
            $deviasi >= -5.00 => 'Aman',
            default => 'Waspada',
        };
    }
}
