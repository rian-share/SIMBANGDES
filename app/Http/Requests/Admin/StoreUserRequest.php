<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'nama_lengkap' => ['required', 'string', 'max:100'],
            'username' => ['required', 'string', 'max:50', 'alpha_dash', Rule::unique('users', 'username')->ignore($this->route('user'))],
            'email' => ['required', 'email', 'max:100', Rule::unique('users', 'email')->ignore($this->route('user'))],
            'role' => ['required', 'in:admin,pemdes,pelaksana'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ];
    }
}
