<?php

namespace App\Http\Requests\Pemdes;

use Illuminate\Foundation\Http\FormRequest;

class TanggapiPengaduanRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'status_pengaduan' => ['required', 'in:Diproses,Selesai,Ditolak'],
            'tanggapan_pemdes' => ['required', 'string', 'min:5'],
        ];
    }
}
