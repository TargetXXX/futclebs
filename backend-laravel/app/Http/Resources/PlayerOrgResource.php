<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlayerOrgResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'avatar' => $this->avatar,
            'primary_position' => $this->primary_position,
            'secondary_position' => $this->secondary_position,
            'is_goalkeeper' => $this->is_goalkeeper,
            'status' => $this->status,
            'birthdate' => $this->birthdate,
            'gender' => $this->gender,
            'created_at' => $this->created_at,
            'username' => $this->username,
            'goals_total' => (int) ($this->goals_total ?? 0),
            'assists_total' => (int) ($this->assists_total ?? 0),

            'pivot' => $this->pivot ? [
                'is_admin' => (bool) ($this->pivot->is_admin ?? false),
                'velocidade' => (int) ($this->pivot->velocidade ?? 0),
                'finalizacao' => (int) ($this->pivot->finalizacao ?? 0),
                'passe' => (int) ($this->pivot->passe ?? 0),
                'drible' => (int) ($this->pivot->drible ?? 0),
                'defesa' => (int) ($this->pivot->defesa ?? 0),
                'fisico' => (int) ($this->pivot->fisico ?? 0),
                'esportividade' => (int) ($this->pivot->esportividade ?? 0),
                'overall' => (int) ($this->pivot->overall ?? 0),
            ] : null,

            'organizations' => OrganizationResource::collection($this->whenLoaded('organizations')),
            'season_overall_history' => $this->season_overall_history ?? [],
            'stats' => new PlayerStatResource($this->whenLoaded('stats')),
        ];
    }
}
