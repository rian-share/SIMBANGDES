<?php

namespace App\Http\Controllers\Publik;

use App\Http\Controllers\Controller;
use App\Models\BeritaPengumuman;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BeritaPublikController extends Controller
{
    public function index(Request $request): Response
    {
        $filter = $request->validate([
            'kategori' => ['nullable', Rule::in(['Berita', 'Pengumuman'])],
            'q' => ['nullable', 'string', 'max:100'],
        ]);

        return Inertia::render('Public/Berita/Index', [
            'berita' => BeritaPengumuman::terbit()
                ->when($filter['kategori'] ?? null, fn ($q, $v) => $q->where('kategori', $v))
                ->when($filter['q'] ?? null, fn ($q, $v) => $q->where('judul', 'like', "%{$v}%"))
                ->latest('published_at')
                ->paginate(9, ['id', 'judul', 'slug', 'kategori', 'ringkasan', 'gambar_cover', 'published_at'])->withQueryString(),
            'pengumumanTerbaru' => BeritaPengumuman::terbit()->where('kategori', 'Pengumuman')
                ->latest('published_at')->limit(5)->get(['id', 'judul', 'slug', 'published_at']),
            'filter' => $filter,
        ]);
    }

    public function show(BeritaPengumuman $berita): Response
    {
        // Draf dan terjadwal dijawab 404 agar keberadaannya tidak bocor.
        abort_unless($berita->is_published && $berita->published_at?->isPast(), 404);
        $berita->load('penulis:id,nama_lengkap');

        return Inertia::render('Public/Berita/Show', [
            'berita' => $berita->only('id', 'judul', 'slug', 'kategori', 'ringkasan', 'konten', 'gambar_cover', 'published_at')
                + ['penulis' => $berita->penulis->nama_lengkap],
            'lainnya' => BeritaPengumuman::terbit()->whereKeyNot($berita->id)
                ->latest('published_at')->limit(4)->get(['id', 'judul', 'slug', 'kategori', 'gambar_cover', 'published_at']),
        ]);
    }
}
