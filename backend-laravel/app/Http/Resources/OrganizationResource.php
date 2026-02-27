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
            'seasons_enabled' => (bool) $this->seasons_enabled,
            'season_duration_days' => $this->season_duration_days,

            'seasons' => OrganizationSeasonResource::collection($this->whenLoaded('seasons')),
            'tournaments' => TournamentResource::collection($this->whenLoaded('tournaments')),
            'players' => PlayerOrgResource::collection($this->whenLoaded('players')),
            'matches' => MatchResource::collection($this->whenLoaded('matches')),
        ];
    }
}

