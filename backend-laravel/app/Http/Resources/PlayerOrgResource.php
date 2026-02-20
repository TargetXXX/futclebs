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

            'organizations' => OrganizationResource::collection($this->whenLoaded('organizations')),
            'stats' => new PlayerStatResource($this->whenLoaded('stats')),
        ];
    }
}
