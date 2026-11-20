<?php

namespace Tests\Unit;

use App\Models\Proyek;
use App\Services\AnalisisRisikoService;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class AnalisisRisikoServiceTest extends TestCase
{
    private function proyek(float $aktual, string $status = 'Berjalan'): Proyek
    {
        return (new Proyek)->forceFill([
            'tanggal_mulai' => Carbon::parse('2026-01-01'),
            'tanggal_selesai' => Carbon::parse('2026-04-11'), // 100 hari
            'target_progres' => 100,
            'progres_aktual' => $aktual,
            'status_proyek' => $status,
        ]);
    }

    public function test_target_berjalan_proporsional_dan_di_clamp(): void
    {
        $s = new AnalisisRisikoService;

        $this->assertSame(50.0, $s->targetBerjalan($this->proyek(0), Carbon::parse('2026-02-20')));
        $this->assertSame(0.0, $s->targetBerjalan($this->proyek(0), Carbon::parse('2025-12-01')));
        $this->assertSame(100.0, $s->targetBerjalan($this->proyek(0), Carbon::parse('2027-01-01')));
    }

    public function test_batas_level_risiko(): void
    {
        $s = new AnalisisRisikoService;
        $hari = Carbon::parse('2026-02-20'); // target berjalan 50.00

        $this->assertSame('Aman', $s->levelRisiko($this->proyek(45.00), $hari));    // deviasi -5.00
        $this->assertSame('Waspada', $s->levelRisiko($this->proyek(44.99), $hari)); // -5.01
        $this->assertSame('Waspada', $s->levelRisiko($this->proyek(35.00), $hari)); // -15.00
        $this->assertSame('Kritis', $s->levelRisiko($this->proyek(34.99), $hari));  // -15.01
        $this->assertSame('Aman', $s->levelRisiko($this->proyek(0, 'Selesai'), $hari));
    }

    public function test_lewat_tenggat_dengan_progres_kurang_adalah_kritis(): void
    {
        $s = new AnalisisRisikoService;

        $this->assertSame('Kritis', $s->levelRisiko($this->proyek(99.00), Carbon::parse('2026-05-01')));
    }

    public function test_tanggal_mulai_sama_dengan_selesai_tidak_membagi_nol(): void
    {
        $p = $this->proyek(0)->forceFill(['tanggal_selesai' => Carbon::parse('2026-01-01')]);

        $this->assertSame(0.0, (new AnalisisRisikoService)->targetBerjalan($p, Carbon::parse('2025-12-31')));
        $this->assertSame(100.0, (new AnalisisRisikoService)->targetBerjalan($p, Carbon::parse('2026-01-01')));
    }
}
