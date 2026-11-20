<?php

namespace App\Http\Controllers\Publik;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePengaduanRequest;
use App\Models\PengaduanMasyarakat;
use App\Models\Proyek;
use App\Services\ImageCompressionService;
use App\Services\TiketPengaduanService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PengaduanPublikController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Public/Pengaduan/Create', [
            'proyek' => Proyek::publik()->orderBy('nama_proyek')->get(['id', 'nama_proyek']),
            'captchaSrc' => captcha_src(),
        ]);
    }

    public function store(StorePengaduanRequest $request, TiketPengaduanService $tiket, ImageCompressionService $gambar): RedirectResponse
    {
        $data = collect($request->validated())->except(['captcha', 'foto_bukti'])->all();
        $data['kode_tiket'] = $tiket->generate();
        $data['foto_bukti'] = $request->hasFile('foto_bukti') ? $gambar->simpan($request->file('foto_bukti'), 'pengaduan') : null;

        PengaduanMasyarakat::create($data);

        return redirect()->route('pengaduan.create')->with('ticket_code', $data['kode_tiket']);
    }

    /** Hanya kolom aman yang dikirim (V-17): tanpa kontak/nama pelapor maupun penanggap internal. */
    public function cek(Request $request): Response
    {
        $kode = strtoupper(trim((string) $request->query('kode')));
        $hasil = $kode === '' ? null : PengaduanMasyarakat::where('kode_tiket', $kode)
            ->first(['kode_tiket', 'status_pengaduan', 'tanggapan_pemdes', 'created_at', 'updated_at']);

        return Inertia::render('Public/Pengaduan/Cek', ['kode' => $kode, 'hasil' => $hasil]);
    }
}
