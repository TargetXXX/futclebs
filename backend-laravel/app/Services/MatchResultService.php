<?php

namespace App\Services;

use App\Models\MatchModel;
use MatchResult;


class MatchResultService
{
    public function create(MatchModel $match, array $data): MatchResult
    {
        return MatchResult::create([
            ...$data,
            'match_id' => $match->id,
        ]);
    }

    public function update(MatchModel $match, array $data): MatchResult
    {
        $match->result->update($data);

        return $match->result->fresh();
    }

    public function delete(MatchModel $match): void
    {
        $match->result()?->delete();
    }
}
