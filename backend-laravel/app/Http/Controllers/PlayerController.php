<?php

namespace App\Http\Controllers;

use App\Http\Requests\Player\UpdatePlayerRequest;
use App\Http\Resources\PlayerResource;
use App\Models\Player;
use App\Services\PlayerService;
use App\Support\SuperAdmin;
use Illuminate\Http\Request;

class PlayerController extends Controller
{
    public function __construct(
        private PlayerService $playerService
    ) {
    }

    public function index(Request $request)
    {
        if (!SuperAdmin::check($request->user())) {
            abort(403, 'Acesso permitido apenas para superadmin.');
        }

        $limit = min(max((int) $request->integer('limit', 20), 1), 100);

        $players = Player::query()
            ->with('organizations')
            ->when($request->filled('phone'), fn ($query) => $query->where('phone', 'like', '%' . $request->string('phone') . '%'))
            ->when($request->filled('name'), fn ($query) => $query->where('name', 'like', '%' . $request->string('name') . '%'))
            ->orderBy('name')
            ->limit($limit)
            ->get();

        return PlayerResource::collection($players);
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

        $data = $request->validated();

        if (array_key_exists('is_admin', $data) && !SuperAdmin::check($request->user())) {
            abort(403, 'Somente superadmins podem alterar privilégios globais.');
        }

        if (array_key_exists('is_active', $data) && !SuperAdmin::check($request->user())) {
            abort(403, 'Somente superadmins podem alterar o status ativo de usuários.');
        }

        $player = $this->playerService->update(
            $player,
            $data
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
