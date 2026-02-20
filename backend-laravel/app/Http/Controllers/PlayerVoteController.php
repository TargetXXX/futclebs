<?php
namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use App\Http\Requests\Vote\StorePlayerVoteRequest;
use App\Models\MatchModel;
use PlayerVoteService;

class PlayerVoteController extends Controller
{
    public function __construct(
        private PlayerVoteService $service
    ) {
    }

    public function store(StorePlayerVoteRequest $request, MatchModel $match)
    {
        $vote = $this->service->create(
            $match,
            $request->user(),
            $request->validated()
        );

        return response()->json($vote, 201);
    }
}
