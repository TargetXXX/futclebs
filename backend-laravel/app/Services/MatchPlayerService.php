<?php

namespace App\Services;


class MatchPlayerService
{
    public function updateMatchPlayerStats($match, $player, array $stats)
    {
        $matchPlayer = $match->players()->where('player_id', $player->id)->first();

        if ($matchPlayer) {
            $matchPlayer->update($stats);
        }

    }
}