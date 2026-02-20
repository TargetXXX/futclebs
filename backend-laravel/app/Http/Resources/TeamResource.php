<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tournament_id' => $this->tournament_id,
            'name' => $this->name,
            'logo' => $this->logo,
            'created_at' => $this->created_at,

            'players' => PlayerResource::collection($this->whenLoaded('players')),
        ];
    }
}
