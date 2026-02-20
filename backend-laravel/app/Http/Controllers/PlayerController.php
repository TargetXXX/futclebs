<?php

namespace App\Http\Controllers;

use App\Http\Requests\Player\UpdatePlayerRequest;
use App\Http\Resources\PlayerResource;
use App\Models\Player;
use App\Services\PlayerService;

class PlayerController extends Controller
{
    public function __construct(
        private PlayerService $playerService
    ) {
    }

    public function get(string $phone)
    {
        $player = Player::where('phone', '=', $phone)->firstOrFail();

        $playerloaded = $player->load('organizations');

        return new PlayerResource($playerloaded);
    }

    public function update(UpdatePlayerRequest $request, Player $player)
    {
        $this->authorize('update', $player);

        $player = $this->playerService->update(
            $player,
            $request->validated()
        );

        return new PlayerResource($player);
    }


    public function destroy(Player $player)
    {
        $this->authorize('delete', $player);

        $this->playerService->delete($player);

        return response()->json([
            'message' => 'Player removido com sucesso'
        ]);
    }
}
