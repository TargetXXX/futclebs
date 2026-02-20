<?php

namespace App\Http\Requests\MatchResult;

use Illuminate\Foundation\Http\FormRequest;

class StoreMatchResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'goals_team_a' => ['required', 'integer', 'min:0'],
            'goals_team_b' => ['required', 'integer', 'min:0'],

            'players_team_a' => ['required', 'array'],
            'players_team_a.*' => ['integer', 'exists:players,id'],

            'players_team_b' => ['required', 'array'],
            'players_team_b.*' => ['integer', 'exists:players,id'],
        ];
    }
}
