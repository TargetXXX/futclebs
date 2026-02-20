<?php

namespace App\Http\Requests\Match;

use Illuminate\Foundation\Http\FormRequest;

class StoreMatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'organization_id' => ['required', 'exists:organizations,id'],
            'tournament_id' => ['nullable', 'exists:tournaments,id'],
            'name' => ['nullable', 'string'],
            'match_date' => ['required', 'date'],
            'team_a_id' => ['nullable', 'required_with:tournament_id', 'exists:teams,id'],
            'team_b_id' => ['nullable', 'required_with:tournament_id', 'exists:teams,id', 'different:team_a_id'],
        ];
    }
}
