<?php

namespace App\Services;

use App\Models\Tournament;



class TournamentService
{
    public function getByOrganization(int $organizationId)
    {
        return Tournament::where('organization_id', $organizationId)
            ->with('teams')
            ->get();
    }

    public function create(array $data): Tournament
    {
        return Tournament::create($data);
    }

    public function findWithRelations(Tournament $tournament): Tournament
    {
        return $tournament->load('teams', 'standings', 'matches');
    }

    public function update(Tournament $tournament, array $data): Tournament
    {
        $tournament->update($data);
        return $tournament;
    }

    public function delete(Tournament $tournament): void
    {
        $tournament->delete();
    }
}
