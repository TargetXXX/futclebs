<?php

namespace App\Services;

use App\Models\Team;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;



class TeamService
{
    public function create(array $data): Team
    {
        return DB::transaction(function () use ($data) {
            $team = Team::create(collect($data)->except(['player_ids'])->all());
            $this->syncPlayersAndCoach($team, $data);

            return $team->load('players', 'coach');
        });
    }

    public function findWithPlayers(Team $team): Team
    {
        return $team->load('players', 'coach');
    }

    public function update(Team $team, array $data): Team
    {
        return DB::transaction(function () use ($team, $data) {
            $team->update(collect($data)->except(['player_ids'])->all());
            $this->syncPlayersAndCoach($team, $data);

            return $team->load('players', 'coach');
        });
    }

    public function delete(Team $team): void
    {
        $team->delete();
    }

    private function syncPlayersAndCoach(Team $team, array $data): void
    {
        $organizationPlayerIds = $team->tournament
            ->organization
            ->players()
            ->pluck('players.id')
            ->map(fn ($id) => (int) $id);

        if (array_key_exists('player_ids', $data)) {
            $playerIds = collect($data['player_ids'] ?? [])->map(fn ($id) => (int) $id)->values();

            if ($playerIds->diff($organizationPlayerIds)->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'player_ids' => 'Todos os jogadores do time devem pertencer à organização do torneio.',
                ]);
            }

            $team->players()->sync($playerIds->all());
        }

        if (array_key_exists('coach_id', $data) && !is_null($data['coach_id'])) {
            $coachId = (int) $data['coach_id'];

            if (!$organizationPlayerIds->contains($coachId)) {
                throw ValidationException::withMessages([
                    'coach_id' => 'O técnico precisa ser um jogador da organização.',
                ]);
            }

        }
    }
}
