<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlayerStatResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'velocidade' => $this->velocidade,
            'finalizacao' => $this->finalizacao,
            'passe' => $this->passe,
            'drible' => $this->drible,
            'defesa' => $this->defesa,
            'fisico' => $this->fisico,
            'overall' => $this->overall,
        ];
    }
}

