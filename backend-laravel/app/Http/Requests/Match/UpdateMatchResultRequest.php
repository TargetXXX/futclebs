<?php

namespace App\Http\Requests\MatchResult;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMatchResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'goals_team_a' => ['sometimes', 'integer', 'min:0'],
            'goals_team_b' => ['sometimes', 'integer', 'min:0'],

            'players_team_a' => ['sometimes', 'array'],
            'players_team_a.*' => ['integer', 'exists:players,id'],

            'players_team_b' => ['sometimes', 'array'],
            'players_team_b.*' => ['integer', 'exists:players,id'],
        ];
    }
}
