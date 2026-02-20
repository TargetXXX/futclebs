<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MatchResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'match_date' => $this->match_date,
            'status' => $this->status,

            'organization' => new OrganizationResource($this->whenLoaded('organization')),

            'tournament_id' => $this->tournament_id,
            'team_a_id' => $this->team_a_id,
            'team_b_id' => $this->team_b_id,

            'tournament' => new TournamentResource($this->whenLoaded('tournament')),
            'team_a' => new TeamResource($this->whenLoaded('teamA')),
            'team_b' => new TeamResource($this->whenLoaded('teamB')),

            'players' => PlayerResource::collection($this->whenLoaded('players')),
            'result' => new MatchResultResource($this->whenLoaded('result')),
            'comments' => MatchCommentResource::collection($this->whenLoaded('comments')),
        ];
    }
}

