<?php

namespace App\Http\Requests\Pelaksana;

use App\Models\Proyek;
use Illuminate\Foundation\Http\FormRequest;

class StoreLaporanRequest extends FormRequest
{
    /** Proyek yang dilaporkan; kepemilikan diverifikasi di controller (404 bila milik pelaksana lain). */
    protected function proyek(): Proyek
    {
        return $this->route('proyek');
    }

    protected function prepareForValidation(): void
    {
        abort_unless($this->proyek()->pelaksana_id === $this->user()->id, 404);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $foto = ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'];

        return [
            'persentase_fisik' => ['required', 'numeric', 'between:0,100', 'gte:'.(float) $this->proyek()->progres_aktual],
            'keterangan' => ['required', 'string'],
            'kendala' => ['nullable', 'string'],
            'foto' => ['required', 'array', 'min:1'],
            'foto.Sebelum' => $foto,
            'foto.Saat' => $foto,
            'foto.Sesudah' => $foto,
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'foto.required' => 'Unggah minimal 1 foto dokumentasi.',
            'persentase_fisik.gte' => 'Progres tidak boleh lebih kecil dari progres yang sudah disetujui.',
        ];
    }
}
