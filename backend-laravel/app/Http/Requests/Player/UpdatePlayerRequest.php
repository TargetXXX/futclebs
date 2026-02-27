<?php

namespace App\Http\Requests\Player;

use App\Enums\PlayerPosition;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdatePlayerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string'],
            'phone' => ['sometimes', 'string'],
            'email' => ['sometimes', 'email'],

            'primary_position' => ['sometimes', new Enum(PlayerPosition::class)],
            'secondary_position' => ['sometimes', new Enum(PlayerPosition::class)],

            'password' => ['sometimes', 'string', 'min:6'],
            'current_password' => ['required_with:password'],

            'avatar' => ['sometimes', 'string'],
            'is_admin' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.string' => 'Nome inválido.',
            'phone.string' => 'Telefone inválido.',
            'email.email' => 'Email inválido.',

            'primary_position.enum' => 'Posição primária inválida.',
            'secondary_position.enum' => 'Posição secundária inválida.',

            'password.string' => 'Senha inválida.',
            'password.min' => 'Senha deve ter no mínimo :min caracteres.',
            'current_password.required_with' => 'Senha atual é obrigatória para alterar a senha.',

            'avatar.string' => 'Avatar inválido.',
            'is_admin.boolean' => 'O valor de admin global deve ser verdadeiro ou falso.',

        ];
    }
}
