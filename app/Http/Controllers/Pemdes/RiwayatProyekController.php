<?php

namespace App\Http\Controllers\Pemdes;

use App\Http\Controllers\Controller;
use App\Models\LogAktivitas;
use App\Models\Proyek;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RiwayatProyekController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $request->validate(['proyek' => ['nullable', 'integer', 'exists:proyek,id']]);

        $proyek = Proyek::withMax('logAktivitas', 'created_at')->withCount('logAktivitas')
            ->orderByDesc('log_aktivitas_max_created_at')->orderBy('nama_proyek')
            ->get(['id', 'nama_proyek', 'status_proyek']);

        $dipilih = (int) ($request->query('proyek') ?: $proyek->first()?->id);

        $riwayat = $dipilih
            ? LogAktivitas::with('user:id,nama_lengkap,role')->where('proyek_id', $dipilih)
                ->latest('created_at')->latest('id')->paginate(30)->withQueryString()
                ->through(fn (LogAktivitas $l) => $l->append('uraian'))
            : null;

        return Inertia::render('Pemdes/Riwayat/Index', ['proyek' => $proyek, 'dipilih' => $dipilih ?: null, 'riwayat' => $riwayat]);
    }
}
