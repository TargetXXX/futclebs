<?php

namespace App\Http\Controllers;

use App\Http\Requests\Tournament\StoreTournamentRequest;
use App\Http\Requests\Tournament\UpdateTournamentRequest;
use App\Http\Resources\TournamentResource;

use App\Models\Tournament;
use App\Services\TournamentService;

class TournamentController extends Controller
{
    public function __construct(
        private TournamentService $tournamentService
    ) {
    }

    public function index($organizationId)
    {
        $tournaments = $this->tournamentService->getByOrganization($organizationId);

        return TournamentResource::collection($tournaments);
    }

    public function store(StoreTournamentRequest $request)
    {
        $tournament = $this->tournamentService->create($request->validated());

        return new TournamentResource($tournament);
    }

    public function show(Tournament $tournament)
    {
        $tournament = $this->tournamentService->findWithRelations($tournament);

        return new TournamentResource($tournament);
    }

    public function update(UpdateTournamentRequest $request, Tournament $tournament)
    {
        $tournament = $this->tournamentService->update($tournament, $request->validated());

        return new TournamentResource($tournament);
    }

    public function destroy(Tournament $tournament)
    {
        $this->tournamentService->delete($tournament);

        return response()->json(['message' => 'Torneio removido']);
    }
}

