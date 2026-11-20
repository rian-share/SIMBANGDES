<?php

namespace App\Http\Requests\Pemdes;

use Illuminate\Foundation\Http\FormRequest;

class TolakLaporanRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['catatan_revisi' => ['required', 'string', 'min:10']];
    }
}
