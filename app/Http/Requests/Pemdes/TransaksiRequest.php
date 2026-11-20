<?php

namespace App\Http\Requests\Pemdes;

use App\Models\Anggaran;
use App\Models\TransaksiPengeluaran;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TransaksiRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        $transaksi = $this->route('transaksi');
        $anggaranId = $transaksi instanceof TransaksiPengeluaran
            ? $transaksi->anggaran_id
            : Anggaran::where('proyek_id', $this->route('proyek')->id)->value('id');

        return [
            // Komponen wajib milik anggaran yang sama (cegah lintas-proyek).
            'rab_komponen_id' => ['nullable', 'integer', Rule::exists('rab_komponen', 'id')->where('anggaran_id', $anggaranId)],
            'tanggal_transaksi' => ['required', 'date'],
            'uraian' => ['required', 'string', 'max:255'],
            'nominal' => ['required', 'numeric', 'gt:0', 'max:9999999999999.99'],
            'bukti_transaksi' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ];
    }
}
