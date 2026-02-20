<?php

namespace App\Http\Requests\Organization;

use Illuminate\Foundation\Http\FormRequest;

class JoinOrganizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'password' => ['required', 'string', 'min:4'],
        ];
    }

    public function messages(): array
    {
        return [
            'password.required' => 'A senha da organização é obrigatória.',
            'password.min' => 'A senha deve ter pelo menos 4 caracteres.',
        ];
    }
}
