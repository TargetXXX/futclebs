<?php

namespace App\Http\Requests\Match;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $organizationId = (int) $this->input('organization_id');

        $tournamentId = $this->input('tournament_id');

        return [
            'organization_id' => ['required', 'exists:organizations,id'],
            'tournament_id' => [
                'nullable',
                Rule::exists('tournaments', 'id')->where(fn ($query) => $query->where('organization_id', $organizationId)),
            ],
            'name' => ['nullable', 'string'],
            'match_date' => ['required', 'date'],
            'team_a_id' => [
                'nullable',
                'required_with:tournament_id',
                Rule::exists('teams', 'id')->where(fn ($query) => $query->where('tournament_id', $tournamentId)),
            ],
            'team_b_id' => [
                'nullable',
                'required_with:tournament_id',
                Rule::exists('teams', 'id')->where(fn ($query) => $query->where('tournament_id', $tournamentId)),
                'different:team_a_id',
            ],
        ];
    }
}
