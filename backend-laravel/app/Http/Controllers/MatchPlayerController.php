<?php

namespace App\Http\Controllers;

use App\Http\Requests\Match\StoreMatchPlayerStatsRequest;
use App\Models\MatchModel;
use App\Models\Player;
use App\Services\MatchPlayerService;

class MatchPlayerController extends Controller
{
    public function __construct(
        private MatchPlayerService $service
    ) {
    }

    public function index(MatchModel $match)
    {
        return $match->players()
            ->withPivot(['is_goalkeeper', 'team', 'goals', 'assists', 'minutes_played', 'yellow_cards', 'red_cards'])
            ->get();
    }

    public function show(MatchModel $match, Player $player)
    {
        return $match->players()
            ->where('player_id', $player->id)
            ->withPivot(['is_goalkeeper', 'team', 'goals', 'assists', 'minutes_played', 'yellow_cards', 'red_cards'])
            ->first();
    }

    public function store(MatchModel $match, Player $player)
    {
        $this->service->register($match, $player);

        return response()->json(['message' => 'Jogador inscrito com sucesso.'], 201);
    }

    public function destroy(MatchModel $match, Player $player)
    {
        $this->service->remove($match, $player);

        return response()->json(['message' => 'Jogador removido da partida com sucesso.']);
    }

    public function updateStats(StoreMatchPlayerStatsRequest $request, MatchModel $match, Player $player)
    {
        $stats = $request->validated();

        $this->service->updateMatchPlayerStats($match, $player, $stats);

        return response()->json(['message' => 'Estatísticas do jogador atualizadas com sucesso.']);
    }
}
