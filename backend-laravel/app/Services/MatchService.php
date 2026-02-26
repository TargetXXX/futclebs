<?php

namespace App\Services;

use App\Models\MatchModel;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class MatchService
{
    public function getByOrganization(int $organizationId): Collection
    {
        return MatchModel::where('organization_id', $organizationId)->get();
    }

    public function create(array $data): MatchModel
    {
        return DB::transaction(function () use ($data) {
            $match = MatchModel::create([
                ...$data,
                'status' => $data['status'] ?? 'open',
            ]);

            if ($match->tournament_id && $match->team_a_id && $match->team_b_id) {
                $teamAPlayers = $match->teamA?->players()->pluck('players.id')->all() ?? [];
                $teamBPlayers = $match->teamB?->players()->pluck('players.id')->all() ?? [];

                foreach ($teamAPlayers as $playerId) {
                    $match->players()->syncWithoutDetaching([
                        $playerId => [
                            'is_goalkeeper' => false,
                            'team' => 1,
                            'goals' => 0,
                            'assists' => 0,
                            'minutes_played' => 0,
                            'yellow_cards' => 0,
                            'red_cards' => 0,
                        ],
                    ]);
                }

                foreach ($teamBPlayers as $playerId) {
                    if (in_array($playerId, $teamAPlayers, true)) {
                        continue;
                    }

                    $match->players()->syncWithoutDetaching([
                        $playerId => [
                            'is_goalkeeper' => false,
                            'team' => 2,
                            'goals' => 0,
                            'assists' => 0,
                            'minutes_played' => 0,
                            'yellow_cards' => 0,
                            'red_cards' => 0,
                        ],
                    ]);
                }
            }

            return $match;
        });
    }

    public function findWithRelations(MatchModel $match): MatchModel
    {
        return $match->load('teamA', 'teamB', 'tournament', 'result', 'players', 'comments');
    }
}
