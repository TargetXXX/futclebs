<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\Player;
use Illuminate\Validation\ValidationException;

class OrganizationPlayerService
{
    public function addPlayer(
        Organization $organization,
        Player $player
    ): void {

        if ($organization->players()->where('player_id', $player->id)->exists()) {
            throw ValidationException::withMessages([
                'player' => ['Player já pertence a esta organização.']
            ]);
        }

        $organization->players()->attach($player->id, [
            'is_admin' => false,
            'velocidade' => 60,
            'finalizacao' => 60,
            'passe' => 60,
            'drible' => 60,
            'defesa' => 60,
            'fisico' => 60,
            'overall' => 60,
        ]);
    }


    public function removePlayer(
        Organization $organization,
        Player $player
    ): void {

        if (!$organization->players()->where('player_id', $player->id)->exists()) {
            throw ValidationException::withMessages([
                'player' => ['Player não pertence a esta organização.']
            ]);
        }

        $adminsCount = $organization->players()
            ->wherePivot('is_admin', true)
            ->count();

        $isTargetAdmin = $organization->players()
            ->where('player_id', $player->id)
            ->wherePivot('is_admin', true)
            ->exists();

        if ($isTargetAdmin && $adminsCount <= 1) {
            throw ValidationException::withMessages([
                'organization' => ['Não é possível remover o último admin da organização.']
            ]);
        }

        $organization->players()->detach($player->id);
    }
}
