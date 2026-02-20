<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MatchResultResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'match_id' => $this->match_id,
            'goals_team_a' => $this->goals_team_a,
            'goals_team_b' => $this->goals_team_b,
            'players_team_a' => $this->players_team_a,
            'players_team_b' => $this->players_team_b,
        ];
    }
}

