<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['anggaran_id', 'rab_komponen_id', 'tanggal_transaksi', 'uraian', 'nominal', 'bukti_transaksi', 'created_by'])]
class TransaksiPengeluaran extends Model
{
    protected $table = 'transaksi_pengeluaran';

    protected function casts(): array
    {
        return [
            'tanggal_transaksi' => 'date',
            'nominal' => 'decimal:2',
        ];
    }

    public function anggaran(): BelongsTo
    {
        return $this->belongsTo(Anggaran::class);
    }

    public function komponen(): BelongsTo
    {
        return $this->belongsTo(RabKomponen::class, 'rab_komponen_id');
    }

    public function pembuat(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
