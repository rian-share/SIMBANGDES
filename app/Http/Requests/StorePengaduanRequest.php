<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePengaduanRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'proyek_id' => ['nullable', Rule::exists('proyek', 'id')->where('is_public', true)],
            'nama_pelapor' => ['required', 'string', 'max:100'],
            'kontak_pelapor' => ['nullable', 'string', 'max:50'],
            'lokasi_kejadian' => ['required', 'string', 'max:200'],
            'isi_pengaduan' => ['required', 'string', 'max:3000'],
            'foto_bukti' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'captcha' => ['required', 'captcha'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'captcha.captcha' => 'Kode keamanan salah.',
            'proyek_id.exists' => 'Proyek tidak valid.',
        ];
    }
}
