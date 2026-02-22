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
            'goals_team_a' => ['sometimes', 'integer', 'min:0'],
            'goals_team_b' => ['sometimes', 'integer', 'min:0'],

            'players_team_a' => ['required_without:players_team_b', 'array'],
            'players_team_a.*' => ['integer', 'exists:players,id'],

            'players_team_b' => ['required_without:players_team_a', 'array'],
            'players_team_b.*' => ['integer', 'exists:players,id'],

            'scorers' => ['sometimes', 'array'],
            'scorers.*.player_id' => ['required_with:scorers', 'integer', 'exists:players,id'],
            'scorers.*.team' => ['required_with:scorers', 'in:A,B'],
            'scorers.*.goals' => ['required_with:scorers', 'integer', 'min:0'],

            'assists' => ['sometimes', 'array'],
            'assists.*.player_id' => ['required_with:assists', 'integer', 'exists:players,id'],
            'assists.*.team' => ['required_with:assists', 'in:A,B'],
            'assists.*.assists' => ['required_with:assists', 'integer', 'min:0'],
        ];
    }
}
