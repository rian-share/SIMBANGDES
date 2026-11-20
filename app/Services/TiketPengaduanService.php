<?php

namespace App\Services;

use App\Models\PengaduanMasyarakat;
use Illuminate\Support\Str;

class TiketPengaduanService
{
    /** Format ADU-YYYY-XXXX (4 karakter alfanumerik kapital), dijamin unik di database (BR-ADU 1). */
    public function generate(): string
    {
        do {
            $kode = 'ADU-'.now()->format('Y').'-'.Str::upper(Str::random(4));
        } while (PengaduanMasyarakat::where('kode_tiket', $kode)->exists());

        return $kode;
    }
}
