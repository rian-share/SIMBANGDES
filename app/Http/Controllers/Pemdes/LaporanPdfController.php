<?php

namespace App\Http\Controllers\Pemdes;

use App\Http\Controllers\Controller;
use App\Models\Proyek;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class LaporanPdfController extends Controller
{
    public function __invoke(): Response
    {
        $proyek = Proyek::with('pelaksana:id,nama_lengkap', 'anggaran')->orderBy('nama_proyek')->get();

        return Pdf::setOption(['isRemoteEnabled' => false])
            ->loadView('pdf.rekap_proyek', ['proyek' => $proyek, 'dicetak' => now()])
            ->download('rekap-pembangunan-'.now()->format('Ymd').'.pdf');
    }
}
