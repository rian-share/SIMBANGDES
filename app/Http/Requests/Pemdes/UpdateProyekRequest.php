<?php

namespace App\Http\Requests\Pemdes;

class UpdateProyekRequest extends StoreProyekRequest
{
    /** Data anggaran diubah lewat AnggaranController, bukan di sini. */
    public function rules(): array
    {
        return array_diff_key(parent::rules(), array_flip(['tahun_anggaran', 'sumber_dana', 'pagu_anggaran']));
    }
}
