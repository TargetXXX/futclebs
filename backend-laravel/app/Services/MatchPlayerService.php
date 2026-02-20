<?php

namespace App\Services;

use App\Models\MatchModel;
use App\Models\Player;

class MatchPlayerService
{
    public function register(MatchModel $match, Player $player): void
    {
        $match->players()->syncWithoutDetaching([
            $player->id => [
                'is_goalkeeper' => (bool) $player->is_goalkeeper,
                'team' => 1,
                'goals' => 0,
                'assists' => 0,
                'minutes_played' => 0,
                'yellow_cards' => 0,
                'red_cards' => 0,
            ],
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
            $match->players()->updateExistingPivot($player->id, $stats);
        }
    }
}
