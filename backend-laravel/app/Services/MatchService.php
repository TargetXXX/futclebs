<?php

namespace App\Services;

use App\Models\MatchModel;
use Illuminate\Database\Eloquent\Collection;

class MatchService
{
    public function getByOrganization(int $organizationId): Collection
    {
        return MatchModel::where('organization_id', $organizationId)->get();
    }

    public function create(array $data): MatchModel
    {
        return MatchModel::create([
            ...$data,
            'status' => $data['status'] ?? 'open',
        ]);
    }

    public function findWithRelations(MatchModel $match): MatchModel
    {
        return $match->load('teamA', 'teamB', 'tournament', 'result', 'players', 'comments');
    }
}
