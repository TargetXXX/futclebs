<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\OrganizationPlayerSeasonOverall;
use App\Models\OrganizationSeason;
use App\Models\Player;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class OrganizationSeasonService
{
    public function syncActiveSeason(Organization $organization): ?OrganizationSeason
    {
        if (!$organization->seasons_enabled || !$organization->season_duration_days) {
            return null;
        }

        $current = $organization->seasons()
            ->where('is_active', true)
            ->orderByDesc('starts_at')
            ->first();

        $now = now();

        if (!$current) {
            return $this->createSeason($organization, $now);
        }

        if ($now->greaterThanOrEqualTo($current->ends_at)) {
            $current->update(['is_active' => false]);
            return $this->createSeason($organization, Carbon::parse($current->ends_at));
        }

        return $current;
    }

    private function createSeason(Organization $organization, Carbon $startAt): OrganizationSeason
    {
        $duration = (int) $organization->season_duration_days;
        $seasonNumber = $organization->seasons()->count() + 1;

        return $organization->seasons()->create([
            'name' => sprintf('Temporada %d', $seasonNumber),
            'starts_at' => $startAt,
            'ends_at' => $startAt->copy()->addDays($duration),
            'is_active' => true,
        ]);
    }

    public function upsertPlayerOverallSnapshot(Organization $organization, Player $player, int $overall): void
    {
        $season = $this->syncActiveSeason($organization);

        $reference = $season
            ? sprintf('season:%d', $season->id)
            : 'all_time';

        OrganizationPlayerSeasonOverall::updateOrCreate(
            [
                'organization_id' => $organization->id,
                'player_id' => $player->id,
                'season_reference' => $reference,
            ],
            [
                'organization_season_id' => $season?->id,
                'overall' => $overall,
                'recorded_at' => now(),
            ]
        );
    }


    public function bootstrapCurrentSeasonSnapshots(Organization $organization): void
    {
        $organization->loadMissing('players');

        foreach ($organization->players as $player) {
            $overall = (int) ($player->pivot->overall ?? 60);
            $this->upsertPlayerOverallSnapshot($organization, $player, $overall);
        }
    }

    public function getPlayerHistoryMap(Organization $organization): Collection
    {
        $rows = OrganizationPlayerSeasonOverall::query()
            ->where('organization_id', $organization->id)
            ->with('season')
            ->orderByDesc('recorded_at')
            ->get();

        return $rows
            ->groupBy('player_id')
            ->map(fn (Collection $histories) => $histories->map(function (OrganizationPlayerSeasonOverall $item) {
                return [
                    'season_id' => $item->organization_season_id,
                    'season_name' => $item->season?->name ?? 'Sem temporadas',
                    'season_reference' => $item->season_reference,
                    'overall' => (int) $item->overall,
                    'recorded_at' => optional($item->recorded_at)->toISOString(),
                    'starts_at' => optional($item->season?->starts_at)->toISOString(),
                    'ends_at' => optional($item->season?->ends_at)->toISOString(),
                    'is_active' => (bool) ($item->season?->is_active ?? false),
                ];
            })->values());
    }
}
