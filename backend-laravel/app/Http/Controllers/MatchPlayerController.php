<?php

namespace App\Http\Requests\Match;

use App\Http\Controllers\Controller;
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
        return $match->players()->withPivot(['is_goalkeeper', 'team', 'goals', 'assists', 'minutes_played', 'yellow_cards', 'red_cards'])->get();
    }

    public function show(MatchModel $match, Player $player)
    {
        return $match->players()->where('player_id', $player->id)->withPivot(['is_goalkeeper', 'team', 'goals', 'assists', 'minutes_played', 'yellow_cards', 'red_cards'])->first();
    }

    public function updateStats(StoreMatchPlayerStatsRequest $request, MatchModel $match, Player $player)
    {

        $stats = $request->validated();


        $this->service->updateMatchPlayerStats($match, $player, $stats);

        return response()->json(['message' => 'Estatísticas do jogador atualizadas com sucesso.']);
    }


}