<?php

namespace App\Http\Requests\Pemdes;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAnggaranRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'sumber_dana' => ['required', 'string', 'max:100'],
            'pagu_anggaran' => ['required', 'numeric', 'min:0', 'max:9999999999999.99'],
        ];
    }
}
