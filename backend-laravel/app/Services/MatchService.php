<?php

namespace App\Services;

use App\Models\MatchModel;

class MatchService
{
    public function create(array $data): MatchModel
    {
        return MatchModel::create($data);
    }

    public function findWithRelations(MatchModel $match): MatchModel
    {
        return $match->load('teamA', 'teamB', 'tournament', 'result');
    }
}
