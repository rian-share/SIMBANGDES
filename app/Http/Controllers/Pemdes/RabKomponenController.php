<?php

namespace App\Http\Controllers\Pemdes;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pemdes\RabKomponenRequest;
use App\Models\Proyek;
use App\Models\RabKomponen;
use App\Services\KalkulasiAnggaranService;
use Illuminate\Http\RedirectResponse;

class RabKomponenController extends Controller
{
    public function __construct(private KalkulasiAnggaranService $service) {}

    public function store(RabKomponenRequest $request, Proyek $proyek): RedirectResponse
    {
        $this->service->simpanKomponen($proyek->anggaran()->firstOrFail(), $request->validated());

        return back()->with('success', 'Komponen rencana ditambahkan.');
    }

    public function update(RabKomponenRequest $request, RabKomponen $komponen): RedirectResponse
    {
        $this->service->simpanKomponen($komponen->anggaran()->firstOrFail(), $request->validated(), $komponen);

        return back()->with('success', 'Komponen rencana diperbarui.');
    }

    public function destroy(RabKomponen $komponen): RedirectResponse
    {
        abort_if($komponen->transaksi()->exists(), 422, 'Komponen sudah memiliki transaksi dan tidak dapat dihapus.');

        $komponen->delete();

        return back()->with('success', 'Komponen rencana dihapus.');
    }
}
