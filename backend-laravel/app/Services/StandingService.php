<?php

namespace App\Services;

use Standing;


class StandingService
{
    public function getByTournament(int $tournamentId)
    {
        return Standing::where('tournament_id', $tournamentId)
            ->with('team')
            ->orderByDesc('points')
            ->orderByDesc('goal_difference')
            ->orderByDesc('goals_for')
            ->get();
    }
}
