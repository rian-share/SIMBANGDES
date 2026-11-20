<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['anggaran_id', 'nama_komponen', 'nominal_rencana'])]
class RabKomponen extends Model
{
    use HasFactory;

    protected $table = 'rab_komponen';

    protected function casts(): array
    {
        return ['nominal_rencana' => 'decimal:2'];
    }

    public function anggaran(): BelongsTo
    {
        return $this->belongsTo(Anggaran::class);
    }

    public function transaksi(): HasMany
    {
        return $this->hasMany(TransaksiPengeluaran::class);
    }
}
