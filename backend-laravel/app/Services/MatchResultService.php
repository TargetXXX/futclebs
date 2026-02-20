<?php

namespace App\Services;

use App\Models\MatchModel;
use App\Models\MatchResult;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MatchResultService
{
    public function create(MatchModel $match, array $data): MatchResult
    {
        return DB::transaction(function () use ($match, $data) {
            $scorers = collect($data['scorers'] ?? [])->filter(fn ($item) => (int) ($item['goals'] ?? 0) > 0)->values();
            $assists = collect($data['assists'] ?? [])->filter(fn ($item) => (int) ($item['assists'] ?? 0) > 0)->values();

            $this->validateStatsPayload($match, $data, $scorers, $assists);

            $result = MatchResult::create([
                ...$data,
                'match_id' => $match->id,
                'organization_id' => $match->organization_id,
                'tournament_id' => $match->tournament_id,
            ]);

            if ($scorers->isNotEmpty() || $assists->isNotEmpty()) {
                foreach ($match->players()->pluck('players.id') as $playerId) {
                    $match->players()->updateExistingPivot($playerId, ['goals' => 0, 'assists' => 0]);
                }

                foreach ($scorers as $scorer) {
                    $match->players()->updateExistingPivot($scorer['player_id'], ['goals' => $scorer['goals']]);
                }

                foreach ($assists as $assistant) {
                    $match->players()->updateExistingPivot($assistant['player_id'], [
                        'assists' => $assistant['assists'],
                    ]);
                }
            }

            $match->update(['status' => 'finished']);

            return $result;
        });
    }

    public function update(MatchModel $match, array $data): MatchResult
    {
        $match->result->update($data);

        return $match->result->fresh();
    }

    public function delete(MatchModel $match): void
    {
        $match->result()?->delete();
    }

    private function validateStatsPayload(MatchModel $match, array $data, $scorers, $assists): void
    {
        $participantIds = $match->players()->pluck('players.id');

        foreach ($scorers as $scorer) {
            if (!$participantIds->contains($scorer['player_id'])) {
                throw ValidationException::withMessages(['scorers' => 'Todos os artilheiros devem ser jogadores inscritos na partida.']);
            }
        }

        foreach ($assists as $assistant) {
            if (!$participantIds->contains($assistant['player_id'])) {
                throw ValidationException::withMessages(['assists' => 'Todos os assistentes devem ser jogadores inscritos na partida.']);
            }
        }

        $goalsA = (int) $data['goals_team_a'];
        $goalsB = (int) $data['goals_team_b'];

        $scorersA = (int) $scorers->where('team', 'A')->sum('goals');
        $scorersB = (int) $scorers->where('team', 'B')->sum('goals');

        if ($scorers->isNotEmpty() && ($scorersA !== $goalsA || $scorersB !== $goalsB)) {
            throw ValidationException::withMessages([
                'scorers' => 'A soma de gols atribuídos deve ser igual ao placar final para cada time.',
            ]);
        }

        $assistsA = (int) $assists->where('team', 'A')->sum('assists');
        $assistsB = (int) $assists->where('team', 'B')->sum('assists');

        if ($assistsA > $goalsA || $assistsB > $goalsB) {
            throw ValidationException::withMessages([
                'assists' => 'A soma de assistências não pode ser maior que os gols do time.',
            ]);
        }
    }
}
