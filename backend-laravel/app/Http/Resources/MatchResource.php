<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MatchResource extends JsonResource
{
    public function toArray($request)
    {
        $tournament = $this->whenLoaded('tournament');
        $teamA = $this->whenLoaded('teamA');
        $teamB = $this->whenLoaded('teamB');
        $result = $this->whenLoaded('result');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'match_date' => $this->match_date,
            'status' => $this->status,
            'players_count' => $this->whenCounted('players'),

            'organization' => new OrganizationResource($this->whenLoaded('organization')),

            'tournament_id' => $this->tournament_id,
            'team_a_id' => $this->team_a_id,
            'team_b_id' => $this->team_b_id,

            'tournament' => $tournament ? new TournamentResource($tournament) : null,
            'team_a' => $teamA ? new TeamResource($teamA) : null,
            'team_b' => $teamB ? new TeamResource($teamB) : null,

            'players' => PlayerResource::collection($this->whenLoaded('players')),
            'result' => $result ? new MatchResultResource($result) : null,
            'comments' => MatchCommentResource::collection($this->whenLoaded('comments')),
        ];
    }
}
