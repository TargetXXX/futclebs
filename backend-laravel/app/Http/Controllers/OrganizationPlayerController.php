<?php

namespace App\Http\Controllers;

use App\Http\Requests\Organization\StoreOrganizationPlayerRequest;
use App\Http\Requests\Organization\UpdateOrganizationPlayerRoleRequest;
use App\Models\Organization;
use App\Models\Player;
use App\Services\OrganizationPlayerService;

class OrganizationPlayerController extends Controller
{
    public function __construct(
        private OrganizationPlayerService $service
    ) {
    }

    public function index(Organization $organization)
    {
        return $organization->players()->get();
    }

    public function store(
        StoreOrganizationPlayerRequest $request,
        Organization $organization
    ) {
        $player = Player::findOrFail($request->player_id);

        $this->service->addPlayer($organization, $player);

        return response()->json([
            'message' => 'Player adicionado à organização'
        ], 201);
    }

    public function updateRole(
        UpdateOrganizationPlayerRoleRequest $request,
        Organization $organization,
        Player $player
    ) {
        $this->service->updateRole($organization, $player, (bool) $request->boolean('is_admin'));

        return response()->json([
            'message' => 'Permissão do player atualizada na organização'
        ]);
    }

    public function destroy(
        Organization $organization,
        Player $player
    ) {
        $this->service->removePlayer($organization, $player);

        return response()->json([
            'message' => 'Player removido da organização'
        ]);
    }
}
