<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrganizationResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'active' => $this->active,
            'created_at' => $this->created_at,

            'tournaments' => TournamentResource::collection($this->whenLoaded('tournaments')),
            'players' => PlayerOrgResource::collection($this->whenLoaded('players')),
            'matches' => MatchResource::collection($this->whenLoaded('matches')),
        ];
    }
}

