<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LogAktivitas;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Read-only: hanya index (BR-SYS 6.1). */
class AuditTrailController extends Controller
{
    public function index(Request $request): Response
    {
        $request->validate([
            'jenis' => ['nullable', 'in:Login,Logout,Create,Update,Delete'],
            'dari' => ['nullable', 'date'],
            'sampai' => ['nullable', 'date'],
        ]);

        $log = LogAktivitas::with('user:id,nama_lengkap,username')
            ->when($request->query('jenis'), fn ($q, $j) => $q->where('aktivitas', 'like', "$j%"))
            ->when($request->query('q'), fn ($q, $k) => $q->where(fn ($w) => $w->where('aktivitas', 'like', "%$k%")->orWhereHas('user', fn ($u) => $u->where('nama_lengkap', 'like', "%$k%")->orWhere('username', 'like', "%$k%"))))
            ->when($request->query('dari'), fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($request->query('sampai'), fn ($q, $d) => $q->whereDate('created_at', '<=', $d))
            ->latest('id')->paginate(20)->withQueryString();

        return Inertia::render('Admin/Audit/Index', ['log' => $log, 'filter' => $request->only('q', 'jenis', 'dari', 'sampai')]);
    }
}
