<?php

namespace App\Services;

use App\Models\Tournament;
use Illuminate\Support\Facades\DB;

class TournamentService
{
    public function getByOrganization(int $organizationId)
    {
        return Tournament::where('organization_id', $organizationId)
            ->with(['teams', 'matches.result'])
            ->get();
    }

    public function create(array $data): Tournament
    {
        return DB::transaction(function () use ($data) {
            $teams = collect($data['teams'] ?? [])
                ->map(fn ($name) => trim((string) $name))
                ->filter(fn ($name) => $name !== '')
                ->unique(fn ($name) => mb_strtolower($name))
                ->values();

            $tournament = Tournament::create(collect($data)->except('teams')->all());

            if ($teams->isNotEmpty()) {
                $tournament->teams()->createMany(
                    $teams->map(fn ($name) => ['name' => $name])->all()
                );
            }

            return $tournament->load('teams');
        });
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
