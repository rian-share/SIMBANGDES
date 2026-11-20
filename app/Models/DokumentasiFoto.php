<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['laporan_id', 'proyek_id', 'tahap', 'file_path'])]
class DokumentasiFoto extends Model
{
    const UPDATED_AT = null;

    protected $table = 'dokumentasi_foto';

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function laporan(): BelongsTo
    {
        return $this->belongsTo(LaporanProgres::class, 'laporan_id');
    }

    public function proyek(): BelongsTo
    {
        return $this->belongsTo(Proyek::class);
    }
}
