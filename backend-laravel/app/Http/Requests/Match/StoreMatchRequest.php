<?php

namespace App\Http\Requests\Match;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Team;

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

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $teamAId = (int) $this->input('team_a_id');
            $teamBId = (int) $this->input('team_b_id');

            if (!$teamAId || !$teamBId) {
                return;
            }

            $teamAPlayers = Team::query()->whereKey($teamAId)->first()?->players()->pluck('players.id') ?? collect();
            $teamBPlayers = Team::query()->whereKey($teamBId)->first()?->players()->pluck('players.id') ?? collect();

            if ($teamAPlayers->intersect($teamBPlayers)->isNotEmpty()) {
                $validator->errors()->add('team_b_id', 'Os times escolhidos possuem jogadores repetidos. Ajuste os elencos antes de criar a partida.');
            }
        });
    }
}
