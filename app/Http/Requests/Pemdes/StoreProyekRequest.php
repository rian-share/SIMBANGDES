<?php

namespace App\Http\Requests\Pemdes;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProyekRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'nama_proyek' => ['required', 'string', 'max:150'],
            'kategori' => ['nullable', 'string', 'max:100'],
            'lokasi' => ['required', 'string', 'max:200'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'pelaksana_id' => ['required', Rule::exists('users', 'id')->where('role', 'pelaksana')->where('status_aktif', 1)],
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_selesai' => ['required', 'date', 'after_or_equal:tanggal_mulai'],
            'target_progres' => ['required', 'numeric', 'between:0.01,100'],
            'is_public' => ['required', 'boolean'],
            'deskripsi' => ['nullable', 'string'],
            'tahun_anggaran' => ['required', 'integer', 'between:2000,2100'],
            'sumber_dana' => ['required', 'string', 'max:100'],
            'pagu_anggaran' => ['required', 'numeric', 'min:0', 'max:9999999999999.99'],
        ];
    }
}
