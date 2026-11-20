<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// status_pengaduan, tanggapan_pemdes, ditanggapi_oleh diisi controller Pemdes.
#[Fillable(['kode_tiket', 'proyek_id', 'nama_pelapor', 'kontak_pelapor', 'lokasi_kejadian', 'isi_pengaduan', 'foto_bukti'])]
class PengaduanMasyarakat extends Model
{
    protected $table = 'pengaduan_masyarakat';

    public function proyek(): BelongsTo
    {
        return $this->belongsTo(Proyek::class);
    }

    public function penanggap(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ditanggapi_oleh');
    }
}
