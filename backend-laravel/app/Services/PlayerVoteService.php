<?php

use App\Models\PlayerVote;

class PlayerVoteService
{
    public function create($match, $user, array $data)
    {
        return PlayerVote::create([
            ...$data,
            'match_id' => $match->id,
            'organization_id' => $match->organization_id,
            'voter_id' => $user->id,
        ]);
    }
}
