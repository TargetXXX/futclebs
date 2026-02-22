<?php

namespace App\Http\Controllers;

use App\Http\Requests\Team\StoreTeamRequest;
use App\Http\Requests\Team\UpdateTeamRequest;
use App\Http\Resources\TeamResource;
use App\Models\Team;

use App\Services\TeamService;

class TeamController extends Controller
{
    public function __construct(
        private TeamService $teamService
    ) {
    }

    public function store(StoreTeamRequest $request)
    {
        $team = $this->teamService->create($request->validated());

        return new TeamResource($team);
    }

    public function show(Team $team)
    {
        $team = $this->teamService->findWithPlayers($team);

        return new TeamResource($team);
    }

    public function update(UpdateTeamRequest $request, Team $team)
    {
        $team = $this->teamService->update($team, $request->validated());

        return new TeamResource($team);
    }

    public function destroy(Team $team)
    {
        $this->teamService->delete($team);

        return response()->json(['message' => 'Time removido']);
    }
}
