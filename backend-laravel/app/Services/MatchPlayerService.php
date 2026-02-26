<?php

namespace App\Services;

use App\Models\MatchModel;
use App\Models\Player;
use Illuminate\Support\Facades\Schema;

class MatchPlayerService
{
    public function supportedPivotColumns(): array
    {
        $candidates = [
            'is_goalkeeper',
            'team',
            'goals',
            'assists',
            'minutes_played',
            'yellow_cards',
            'red_cards',
        ];

        return array_values(array_filter(
            $candidates,
            fn (string $column) => Schema::hasColumn('match_players', $column)
        ));
    }

    public function register(MatchModel $match, Player $player): void
    {
        $defaultPayload = [
            'is_goalkeeper' => (bool) $player->is_goalkeeper,
            'team' => 1,
            'goals' => 0,
            'assists' => 0,
            'minutes_played' => 0,
            'yellow_cards' => 0,
            'red_cards' => 0,
        ];

        $supportedColumns = $this->supportedPivotColumns();
        $payload = array_intersect_key($defaultPayload, array_flip($supportedColumns));

        $match->players()->syncWithoutDetaching([
            $player->id => $payload,
        ]);
    }

    public function remove(MatchModel $match, Player $player): void
    {
        $match->players()->detach($player->id);
    }

    public function updateMatchPlayerStats(MatchModel $match, Player $player, array $stats): void
    {
        $this->register($match, $player);

        if (!empty($stats)) {
            $supportedColumns = $this->supportedPivotColumns();
            $filteredStats = array_intersect_key($stats, array_flip($supportedColumns));

            if (!empty($filteredStats)) {
                $match->players()->updateExistingPivot($player->id, $filteredStats);
            }
        }
    }
}
