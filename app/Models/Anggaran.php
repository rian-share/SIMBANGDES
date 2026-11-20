<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// total_realisasi & sisa_anggaran sengaja tidak fillable: hanya diisi KalkulasiAnggaranService.
#[Fillable(['proyek_id', 'tahun_anggaran', 'sumber_dana', 'pagu_anggaran'])]
class Anggaran extends Model
{
    protected $table = 'anggaran';

    protected function casts(): array
    {
        return [
            'tahun_anggaran' => 'integer',
            'pagu_anggaran' => 'decimal:2',
            'total_realisasi' => 'decimal:2',
            'sisa_anggaran' => 'decimal:2',
        ];
    }

    protected function persentaseSerapan(): Attribute
    {
        return Attribute::get(fn () => bccomp((string) $this->pagu_anggaran, '0', 2) === 0
            ? 0.0
            : round((float) $this->total_realisasi / (float) $this->pagu_anggaran * 100, 2));
    }

    public function proyek(): BelongsTo
    {
        return $this->belongsTo(Proyek::class);
    }

    public function komponen(): HasMany
    {
        return $this->hasMany(RabKomponen::class);
    }

    public function transaksi(): HasMany
    {
        return $this->hasMany(TransaksiPengeluaran::class);
    }
}
