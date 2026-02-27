<?php

namespace App\Http\Controllers;

use App\Http\Requests\Stats\UpdateOrganizationPlayerStatRequest;
use App\Models\Organization;
use App\Models\Player;
use App\Services\OrganizationPlayerStatsService;

class OrganizationPlayerStatsController extends Controller
{
    public function __construct(
        private OrganizationPlayerStatsService $service
    ) {
    }

    public function updateStats(
        UpdateOrganizationPlayerStatRequest $request,
        Organization $organization,
        Player $player
    ) {
        $this->service->updateStats(
            $organization,
            $player,
            $request->validated()
        );

        return response()->json([
            'message' => 'Stats atualizados com sucesso'
        ]);
    }
}
