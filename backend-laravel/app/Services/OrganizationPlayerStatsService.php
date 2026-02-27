<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\Player;
use Illuminate\Validation\ValidationException;

class OrganizationPlayerStatsService
{
    public function __construct(
        private OrganizationSeasonService $seasonService
    ) {
    }

    public function updateStats(Organization $organization, Player $player, array $data): void
    {
        if (!$organization->players()->where('player_id', $player->id)->exists()) {
            throw ValidationException::withMessages([
                'player' => ['Player não pertence a esta organização.']
            ]);
        }

        $organization->players()->updateExistingPivot($player->id, $data);

        if (array_key_exists('overall', $data)) {
            $this->seasonService->upsertPlayerOverallSnapshot($organization, $player, (int) $data['overall']);
        }
    }
}
