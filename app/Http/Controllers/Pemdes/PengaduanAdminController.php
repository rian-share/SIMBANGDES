<?php

namespace App\Http\Controllers\Pemdes;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pemdes\TanggapiPengaduanRequest;
use App\Models\PengaduanMasyarakat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PengaduanAdminController extends Controller
{
    public function index(Request $request): Response
    {
        $pengaduan = PengaduanMasyarakat::with('proyek:id,nama_proyek')
            ->when($request->query('status'), fn ($q, $s) => $q->where('status_pengaduan', $s))
            ->latest()->paginate(10)->withQueryString();

        return Inertia::render('Pemdes/Pengaduan/Index', ['pengaduan' => $pengaduan, 'filter' => $request->only('status')]);
    }

    public function show(PengaduanMasyarakat $pengaduan): Response
    {
        return Inertia::render('Pemdes/Pengaduan/Show', ['pengaduan' => $pengaduan->load('proyek:id,nama_proyek', 'penanggap:id,nama_lengkap')]);
    }

    public function update(TanggapiPengaduanRequest $request, PengaduanMasyarakat $pengaduan): RedirectResponse
    {
        $pengaduan->forceFill($request->validated() + ['ditanggapi_oleh' => $request->user()->id])->save();

        return back()->with('success', 'Tanggapan tersimpan.');
    }
}
