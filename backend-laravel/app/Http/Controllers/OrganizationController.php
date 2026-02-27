<?php

namespace App\Http\Controllers;

use App\Http\Requests\Organization\JoinOrganizationRequest;
use App\Http\Requests\Organization\StoreOrganizationRequest;
use App\Http\Requests\Organization\UpdateOrganizationPasswordRequest;
use App\Http\Requests\Organization\UpdateOrganizationSeasonSettingsRequest;
use App\Http\Resources\OrganizationResource;
use App\Models\Organization;
use App\Services\OrganizationSeasonService;
use App\Services\OrganizationService;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    public function __construct(
        private OrganizationService $service,
        private OrganizationSeasonService $seasonService,
    ) {
    }

    public function index(Request $request)
    {
        return $this->service->listForUser($request->user());
    }

    public function all(Request $request)
    {
        return $this->service->all();
    }

    public function store(StoreOrganizationRequest $request)
    {
        $organization = $this->service->create($request->validated(), $request->user());
        return response()->json($organization, 201);
    }

    public function show(Organization $organization)
    {
        $this->seasonService->syncActiveSeason($organization);
        $this->seasonService->bootstrapCurrentSeasonSnapshots($organization);

        $organization->load([
            'players' => function ($query) use ($organization) {
                $query
                    ->withPivot(['is_admin', 'velocidade', 'finalizacao', 'passe', 'drible', 'defesa', 'fisico', 'esportividade', 'overall'])
                    ->withSum(['matches as goals_total' => function ($matchQuery) use ($organization) {
                        $matchQuery->where('matches.organization_id', $organization->id);
                    }], 'match_players.goals')
                    ->withSum(['matches as assists_total' => function ($matchQuery) use ($organization) {
                        $matchQuery->where('matches.organization_id', $organization->id);
                    }], 'match_players.assists');
            },
            'matches',
            'tournaments',
            'seasons' => fn ($query) => $query->orderByDesc('starts_at'),
        ]);

        $historyMap = $this->seasonService->getPlayerHistoryMap($organization);

        $organization->players->transform(function ($player) use ($historyMap) {
            $player->season_overall_history = $historyMap->get($player->id, collect([]))->values();
            return $player;
        });

        return OrganizationResource::make($organization);
    }

    public function join(JoinOrganizationRequest $request, Organization $organization)
    {
        $this->service->join($organization, $request->user(), $request->password);

        return response()->json([
            'message' => 'Você entrou na organização com sucesso'
        ]);
    }

    public function updatePassword(UpdateOrganizationPasswordRequest $request, Organization $organization)
    {
        $this->service->updatePassword($organization, $request->current_password, $request->new_password);

        return response()->json([
            'message' => 'Senha da organização atualizada com sucesso'
        ]);
    }

    public function updateSeasonSettings(UpdateOrganizationSeasonSettingsRequest $request, Organization $organization)
    {
        $payload = $request->validated();

        if (!($payload['seasons_enabled'] ?? false)) {
            $payload['season_duration_days'] = null;
        }

        $updated = $this->service->updateSeasonSettings($organization, $payload);
        $this->seasonService->syncActiveSeason($updated);
        $this->seasonService->bootstrapCurrentSeasonSnapshots($updated);

        return response()->json([
            'message' => 'Configurações de temporada atualizadas com sucesso',
            'data' => [
                'seasons_enabled' => (bool) $updated->seasons_enabled,
                'season_duration_days' => $updated->season_duration_days,
            ],
        ]);
    }
}
