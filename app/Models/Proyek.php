<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'nama_proyek', 'kategori', 'lokasi', 'latitude', 'longitude', 'pelaksana_id',
    'tanggal_mulai', 'tanggal_selesai', 'progres_aktual', 'target_progres',
    'status_proyek', 'is_public', 'deskripsi',
])]
class Proyek extends Model
{
    protected $table = 'proyek';

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'tanggal_mulai' => 'date',
            'tanggal_selesai' => 'date',
            'progres_aktual' => 'decimal:2',
            'target_progres' => 'decimal:2',
            'is_public' => 'boolean',
        ];
    }

    public function scopePublik(Builder $query): Builder
    {
        return $query->where('is_public', true);
    }

    public function pelaksana(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pelaksana_id');
    }

    public function anggaran(): HasOne
    {
        return $this->hasOne(Anggaran::class);
    }

    public function laporanProgres(): HasMany
    {
        return $this->hasMany(LaporanProgres::class);
    }

    public function dokumentasiFoto(): HasMany
    {
        return $this->hasMany(DokumentasiFoto::class);
    }

    public function logAktivitas(): HasMany
    {
        return $this->hasMany(LogAktivitas::class);
    }

    public function pengaduan(): HasMany
    {
        return $this->hasMany(PengaduanMasyarakat::class);
    }
}
