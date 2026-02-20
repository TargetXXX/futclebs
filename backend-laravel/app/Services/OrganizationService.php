<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\Player;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class OrganizationService
{

    public function create(array $data, Player $creator): Organization
    {
        $organization = Organization::create($data);

        // Criador vira admin automaticamente
        $organization->players()->attach($creator->id, [
            'is_admin' => true,
            'velocidade' => 60,
            'finalizacao' => 60,
            'passe' => 60,
            'drible' => 60,
            'defesa' => 60,
            'fisico' => 60,
            'overall' => 60,
        ]);

        return $organization;
    }

    public function listForUser(Player $player)
    {
        return $player->organizations()
            ->withPivot([
                'is_admin',
                'velocidade',
                'finalizacao',
                'passe',
                'drible',
                'defesa',
                'fisico',
                'overall'
            ])
            ->get()
            ->map(function ($organization) {

                return [
                    'id' => $organization->id,
                    'name' => $organization->name,
                    'description' => $organization->description,

                    'is_admin' => $organization->pivot->is_admin,

                    'stats' => [
                        'velocidade' => $organization->pivot->velocidade,
                        'finalizacao' => $organization->pivot->finalizacao,
                        'passe' => $organization->pivot->passe,
                        'drible' => $organization->pivot->drible,
                        'defesa' => $organization->pivot->defesa,
                        'fisico' => $organization->pivot->fisico,
                        'overall' => $organization->pivot->overall,
                    ],
                ];
            });
    }

    public function all()
    {
        return Organization::all();
    }



    public function join(
        Organization $organization,
        Player $player,
        string $password
    ): void {

        if ($organization->players()->where('player_id', $player->id)->exists()) {
            throw ValidationException::withMessages([
                'organization' => ['Você já pertence a esta organização.']
            ]);
        }

        if (!Hash::check($password, $organization->password)) {
            throw ValidationException::withMessages([
                'password' => ['Senha da organização incorreta.']
            ]);
        }

        $organization->players()->attach($player->id, [
            'is_admin' => false,
            'velocidade' => 60,
            'finalizacao' => 60,
            'passe' => 60,
            'drible' => 60,
            'defesa' => 60,
            'fisico' => 60,
            'overall' => 60,
        ]);
    }

    public function updatePassword(
        Organization $organization,
        string $currentPassword,
        string $newPassword
    ): void {

        if (!Hash::check($currentPassword, $organization->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Senha atual incorreta.']
            ]);
        }

        $organization->update([
            'password' => $newPassword
        ]);
    }
}
