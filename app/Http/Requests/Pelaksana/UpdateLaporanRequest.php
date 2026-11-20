<?php

namespace App\Http\Requests\Pelaksana;

use App\Models\Proyek;

class UpdateLaporanRequest extends StoreLaporanRequest
{
    protected function proyek(): Proyek
    {
        return $this->route('laporan')->proyek;
    }

    /** Foto lama tetap berlaku, jadi unggahan baru bersifat opsional. */
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'foto' => ['nullable', 'array'],
            'hapus_foto' => ['nullable', 'array'],
            'hapus_foto.*' => ['integer'],
        ]);
    }
}
