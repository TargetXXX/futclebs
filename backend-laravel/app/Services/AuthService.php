<?php

namespace App\Services;

use App\Http\Resources\PlayerResource;
use App\Models\Player;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{

    public function register(array $data): array
    {

        $player = Player::create($data);

        $token = $player->createToken('auth_token')->plainTextToken;

        return [
            'player' => new PlayerResource($player),
            'token' => $token,
        ];
    }

    public function login(array $credentials): array
    {
        $player = Player::with('organizations')->where('phone', $credentials['phone'])->first();

        if (!$player || !Hash::check($credentials['password'], $player->password)) {
            throw ValidationException::withMessages([
                'phone' => ['Credenciais inválidas.'],
            ]);
        }

        $player->tokens()->delete();
        $token = $player->createToken('auth_token')->plainTextToken;


        return [
            'player' => new PlayerResource($player),
            'token' => $token,
        ];
    }

    public function logout(Player $player): void
    {
        $player->currentAccessToken()->delete();
    }
}
