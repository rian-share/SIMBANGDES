<?php

namespace App\Http\Controllers\Pemdes;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pemdes\BeritaRequest;
use App\Models\BeritaPengumuman;
use App\Services\ImageCompressionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BeritaController extends Controller
{
    public function __construct(private ImageCompressionService $gambar) {}

    public function index(Request $request): Response
    {
        $berita = BeritaPengumuman::with('penulis:id,nama_lengkap')
            ->when($request->query('kategori'), fn ($q, $v) => $q->where('kategori', $v))
            ->when($request->query('status'), fn ($q, $v) => $q->where('is_published', $v === 'terbit'))
            ->when($request->query('q'), fn ($q, $v) => $q->where('judul', 'like', "%{$v}%"))
            ->latest()->paginate(10)->withQueryString();

        return Inertia::render('Pemdes/Berita/Index', [
            'berita' => $berita,
            'filter' => $request->only('kategori', 'status', 'q'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Pemdes/Berita/Form');
    }

    public function store(BeritaRequest $request): RedirectResponse
    {
        $data = $request->safe()->except('gambar_cover');
        $data['slug'] = BeritaPengumuman::buatSlug($data['judul']);
        $data['published_at'] = $data['is_published'] ? now() : null;

        if ($request->hasFile('gambar_cover')) {
            $data['gambar_cover'] = $this->gambar->simpan($request->file('gambar_cover'), 'berita');
        }

        $request->user()->beritaPengumuman()->create($data);

        return redirect()->route('pemdes.berita.index')->with('success', 'Berita berhasil dibuat.');
    }

    public function edit(BeritaPengumuman $berita): Response
    {
        return Inertia::render('Pemdes/Berita/Form', ['berita' => $berita]);
    }

    public function update(BeritaRequest $request, BeritaPengumuman $berita): RedirectResponse
    {
        $data = $request->safe()->except('gambar_cover');
        // Slug tidak berubah agar tautan yang sudah dibagikan tetap valid.
        $data['published_at'] = $data['is_published'] ? ($berita->published_at ?? now()) : null;

        $lama = null;
        if ($request->hasFile('gambar_cover')) {
            $lama = $berita->gambar_cover;
            $data['gambar_cover'] = $this->gambar->simpan($request->file('gambar_cover'), 'berita');
        }

        $berita->update($data);

        if ($lama) {
            Storage::disk('public')->delete($lama);
        }

        return redirect()->route('pemdes.berita.index')->with('success', 'Berita berhasil diperbarui.');
    }

    public function destroy(BeritaPengumuman $berita): RedirectResponse
    {
        $cover = $berita->gambar_cover;
        $berita->delete();

        if ($cover) {
            Storage::disk('public')->delete($cover);
        }

        return redirect()->route('pemdes.berita.index')->with('success', 'Berita dihapus.');
    }
}
