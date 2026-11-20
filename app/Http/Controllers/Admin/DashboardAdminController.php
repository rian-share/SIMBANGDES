<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LogAktivitas;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardAdminController extends Controller
{
    public function __invoke(): Response
    {
        $login = LogAktivitas::where('aktivitas', 'like', 'Login%')->where('created_at', '>=', today()->subDays(13))
            ->selectRaw('DATE(created_at) AS hari, COUNT(*) AS jumlah')->groupBy('hari')->pluck('jumlah', 'hari');

        $perRole = User::where('status_aktif', 1)->selectRaw('role, COUNT(*) AS jumlah')->groupBy('role')->pluck('jumlah', 'role');

        return Inertia::render('Admin/Dashboard', [
            'kpi' => [
                'totalUser' => User::count(),
                'userAktif' => User::where('status_aktif', 1)->count(),
                'sesiBerjalan' => DB::table('sessions')->where('last_activity', '>=', now()->subMinutes((int) config('session.lifetime'))->timestamp)->count(),
            ],
            'loginHarian' => collect(range(13, 0))->map(fn ($i) => today()->subDays($i)->toDateString())
                ->map(fn ($hari) => ['hari' => $hari, 'jumlah' => (int) ($login[$hari] ?? 0)]),
            'userPerRole' => collect(['admin', 'pemdes', 'pelaksana'])->map(fn ($r) => ['role' => $r, 'jumlah' => (int) ($perRole[$r] ?? 0)]),
            'logTerbaru' => LogAktivitas::with('user:id,nama_lengkap')->latest('id')->limit(10)->get(),
        ]);
    }
}
