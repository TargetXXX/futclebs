<?php

namespace App\Http\Controllers;

use App\Models\MatchModel;
use App\Http\Requests\Match\StoreMatchRequest;
use App\Http\Resources\MatchResource;
use App\Services\MatchService;

class MatchController extends Controller
{
    public function __construct(
        private MatchService $matchService
    ) {
    }

    public function index($organizationId)
    {
        $matches = $this->matchService->getByOrganization((int) $organizationId);

        return MatchResource::collection($matches);
    }

    public function store(StoreMatchRequest $request)
    {
        $match = $this->matchService->create($request->validated());

        return new MatchResource($match);
    }

    public function show(MatchModel $match)
    {
        $match = $this->matchService->findWithRelations($match);

        return new MatchResource($match);
    }
}
