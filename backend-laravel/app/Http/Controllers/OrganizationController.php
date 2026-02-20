<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrganizationResource;
use App\Models\Organization;
use App\Services\OrganizationService;
use Illuminate\Http\Request;
use App\Http\Requests\Organization\StoreOrganizationRequest;
use App\Http\Requests\Organization\JoinOrganizationRequest;
use App\Http\Requests\Organization\UpdateOrganizationPasswordRequest;

class OrganizationController extends Controller
{
    public function __construct(
        private OrganizationService $service
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
        $organization = $this->service->create(
            $request->validated(),
            $request->user()
        );

        return response()->json($organization, 201);
    }

    /*
    |--------------------------------------------------------------------------
    | Ver organização (middleware org.member)
    |--------------------------------------------------------------------------
    */
    public function show(Organization $organization)
    {

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
            'tournaments'
        ]);

        return OrganizationResource::make($organization);
    }


    public function join(
        JoinOrganizationRequest $request,
        Organization $organization
    ) {
        $this->service->join(
            $organization,
            $request->user(),
            $request->password
        );

        return response()->json([
            'message' => 'Você entrou na organização com sucesso'
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Alterar senha da organização (middleware org.admin)
    |--------------------------------------------------------------------------
    */
    public function updatePassword(
        UpdateOrganizationPasswordRequest $request,
        Organization $organization
    ) {
        $this->service->updatePassword(
            $organization,
            $request->current_password,
            $request->new_password
        );

        return response()->json([
            'message' => 'Senha da organização atualizada com sucesso'
        ]);
    }
}
