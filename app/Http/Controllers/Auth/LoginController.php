<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\LogAktivitas;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'login' => ['required', 'string', 'max:100'],
            'password' => ['required', 'string'],
        ]);

        // Login memakai email ATAU username (FR-01).
        $kolom = filter_var($data['login'], FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        $user = User::where($kolom, $data['login'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['login' => 'Email/username atau kata sandi salah.']);
        }

        if (! $user->status_aktif) {
            throw ValidationException::withMessages(['login' => 'Akun Anda dinonaktifkan. Hubungi administrator.']);
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();
        LogAktivitas::catat('Login');

        return redirect()->intended(route($user->role.'.dashboard'));
    }
}
