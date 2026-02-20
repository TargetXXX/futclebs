<?php

namespace App\Http\Requests\Auth;

use App\Enums\PlayerPosition;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'unique:players,email'],
            'password' => ['required', 'string', 'min:6'],
            'phone' => ['required', 'string', 'max:20', 'unique:players,phone'],
            'primary_position' => ['required', new Enum(PlayerPosition::class)],
            'secondary_position' => ['required', new Enum(PlayerPosition::class)],
            'is_goalkeeper' => ['required', 'nullable', 'boolean'],
            'birthdate' => ['nullable', 'date'],
            'cpf' => ['nullable', 'string', 'max:20', 'unique:players,cpf'],
            'username' => ['required', 'string', 'max:255', 'unique:players,username'],

        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nome é obrigatório.',
            'phone.required' => 'Telefone é obrigatório.',
            'password.required' => 'Senha é obrigatória.',
            'phone.unique' => 'Este telefone já está em uso.',
            'username.required' => 'Username é obrigatório.',

        ];
    }
}
