<?php

namespace App\Http\Requests\Admin;

class UpdateUserRequest extends StoreUserRequest
{
    /** Password diubah lewat resetPassword. */
    public function rules(): array
    {
        return array_diff_key(parent::rules(), ['password' => 1]);
    }
}
