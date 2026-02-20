<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlayerVoteResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'velocidade' => $this->velocidade,
            'finalizacao' => $this->finalizacao,
            'passe' => $this->passe,
            'drible' => $this->drible,
            'defesa' => $this->defesa,
            'fisico' => $this->fisico,

            'voter' => new PlayerResource($this->whenLoaded('voter')),
            'target' => new PlayerResource($this->whenLoaded('target')),
        ];
    }
}

