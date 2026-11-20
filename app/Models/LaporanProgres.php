<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// status_verifikasi, catatan_revisi, verified_by, verified_at diisi controller verifikasi.
#[Fillable(['proyek_id', 'pelaksana_id', 'tanggal_laporan', 'persentase_fisik', 'keterangan', 'kendala'])]
class LaporanProgres extends Model
{
    protected $table = 'laporan_progres';

    protected function casts(): array
    {
        return [
            'tanggal_laporan' => 'date',
            'persentase_fisik' => 'decimal:2',
            'verified_at' => 'datetime',
        ];
    }

    public function proyek(): BelongsTo
    {
        return $this->belongsTo(Proyek::class);
    }

    public function pelaksana(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pelaksana_id');
    }

    public function verifikator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function foto(): HasMany
    {
        return $this->hasMany(DokumentasiFoto::class, 'laporan_id');
    }
}
