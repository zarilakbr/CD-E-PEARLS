<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'locale' => ['sometimes', 'string', 'in:id,en'],
            'theme' => ['sometimes', 'string', 'in:light,dark'],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }
}

