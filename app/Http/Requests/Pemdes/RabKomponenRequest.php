<?php

namespace App\Http\Requests\Pemdes;

use App\Models\Anggaran;
use App\Models\RabKomponen;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RabKomponenRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        $komponen = $this->route('komponen');
        $anggaranId = $komponen instanceof RabKomponen
            ? $komponen->anggaran_id
            : Anggaran::where('proyek_id', $this->route('proyek')->id)->value('id');

        return [
            'nama_komponen' => [
                'required', 'string', 'max:100',
                Rule::unique('rab_komponen', 'nama_komponen')->where('anggaran_id', $anggaranId)->ignore($komponen?->id),
            ],
            'nominal_rencana' => ['required', 'numeric', 'gt:0', 'max:9999999999999.99'],
        ];
    }
}
