<?php

namespace App\Http\Requests\Pemdes;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BeritaRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'judul' => ['required', 'string', 'max:200'],
            'kategori' => ['required', Rule::in(['Berita', 'Pengumuman'])],
            'ringkasan' => ['required', 'string', 'max:300'],
            'konten' => ['required', 'string', 'max:20000'],
            'gambar_cover' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'is_published' => ['required', 'boolean'],
        ];
    }
}
