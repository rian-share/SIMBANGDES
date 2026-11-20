<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::query()
            ->when($request->query('q'), fn ($q, $k) => $q->where(fn ($w) => $w->where('nama_lengkap', 'like', "%$k%")->orWhere('username', 'like', "%$k%")->orWhere('email', 'like', "%$k%")))
            ->when($request->query('role'), fn ($q, $r) => $q->where('role', $r))
            ->orderBy('nama_lengkap')->paginate(10, ['id', 'nama_lengkap', 'username', 'email', 'role', 'status_aktif'])->withQueryString();

        return Inertia::render('Admin/Users/Index', ['users' => $users, 'filter' => $request->only('q', 'role')]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Users/Form');
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        User::create($request->validated() + ['status_aktif' => true]);

        return redirect()->route('admin.users.index')->with('success', 'Akun dibuat.');
    }

    public function edit(User $user): Response
    {
        return Inertia::render('Admin/Users/Form', ['user' => $user->only('id', 'nama_lengkap', 'username', 'email', 'role', 'status_aktif')]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();
        if ($user->is($request->user())) {
            $data['role'] = $user->role; // admin tidak boleh mengubah role-nya sendiri
        }
        $user->update($data);

        return redirect()->route('admin.users.index')->with('success', 'Akun diperbarui.');
    }

    public function toggleStatus(Request $request, User $user): RedirectResponse
    {
        if ($user->is($request->user())) {
            return back()->with('error', 'Anda tidak dapat menonaktifkan akun sendiri.');
        }

        $user->update(['status_aktif' => ! $user->status_aktif]);

        return back()->with('success', $user->status_aktif ? 'Akun diaktifkan.' : 'Akun dinonaktifkan.');
    }

    public function resetPassword(Request $request, User $user): RedirectResponse
    {
        $request->validate(['password' => ['required', 'confirmed', Password::min(8)]]);

        $user->update(['password' => $request->input('password')]);

        return back()->with('success', 'Kata sandi direset.');
    }
}
