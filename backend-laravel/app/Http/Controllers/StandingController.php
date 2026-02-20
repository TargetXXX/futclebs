<?php

namespace App\Http\Controllers;

use App\Http\Resources\StandingResource;
use App\Services\StandingService;
use Standing;

class StandingController extends Controller
{

    public function __construct(
        private StandingService $standingService
    ) {
    }
    public function index($tournamentId)
    {
        $standings = Standing::where('tournament_id', $tournamentId)
            ->with('team')
            ->orderByDesc('points')
            ->orderByDesc('goal_difference')
            ->orderByDesc('goals_for')
            ->get();

        return StandingResource::collection($standings);
    }
}
