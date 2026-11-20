<?php

namespace App\Http\Controllers\Publik;

use App\Http\Controllers\Controller;
use App\Models\Proyek;
use Inertia\Inertia;
use Inertia\Response;

class PetaController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Public/Peta', [
            'proyek' => Proyek::publik()->whereBetween('latitude', [-90, 90])->whereBetween('longitude', [-180, 180])
                ->get(['id', 'nama_proyek', 'lokasi', 'status_proyek', 'progres_aktual', 'latitude', 'longitude']),
        ]);
    }
}
