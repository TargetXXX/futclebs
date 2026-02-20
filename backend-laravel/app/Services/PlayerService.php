<?php

namespace App\Services;

use App\Models\Player;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class PlayerService
{
    public function update(Player $player, array $data): Player
    {


        if (isset($data['password'])) {

            $isAdmin = auth()->user()->is_admin ?? false;

            if (!$isAdmin) {
                if (!isset($data['current_password'])) {
                    throw ValidationException::withMessages([
                        'current_password' => ['Senha atual é obrigatória.'],
                    ]);
                }

                if (!Hash::check($data['current_password'], $player->password)) {
                    throw ValidationException::withMessages([
                        'current_password' => ['Senha atual incorreta.'],
                    ]);
                }
            }

            unset($data['current_password']);
        }

        $player->update($data);

        return $player->fresh();
    }

    public function delete(Player $player): void
    {
        $player->delete();
    }
}
