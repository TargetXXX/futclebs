<?php

namespace App\Policies;

use App\Models\Player;

class PlayerPolicy
{
    public function update(Player $authUser, Player $target): bool
    {
        return $authUser->id === $target->id || $authUser->is_admin;
    }

    public function delete(Player $authUser, Player $target): bool
    {
        return $authUser->is_admin;
    }


}
