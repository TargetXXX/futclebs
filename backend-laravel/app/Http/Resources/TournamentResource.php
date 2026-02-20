<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TournamentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'name' => $this->name,
            'type' => $this->type,
            'status' => $this->status,
            'start_date' => $this->start_date,
            'description' => $this->description,
            'end_date' => $this->end_date,
            'created_at' => $this->created_at,

            'teams' => TeamResource::collection($this->whenLoaded('teams')),
            'standings' => StandingResource::collection($this->whenLoaded('standings')),
            'matches' => MatchResource::collection($this->whenLoaded('matches')),
        ];
    }
}

