<?php

namespace App\Http\Requests\Team;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTeamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'logo' => ['nullable', 'string'],
            'coach_id' => ['nullable', 'exists:players,id'],
            'player_ids' => ['sometimes', 'array'],
            'player_ids.*' => ['integer', 'distinct', 'exists:players,id'],
        ];
    }
}
