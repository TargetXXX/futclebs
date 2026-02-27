<?php

namespace App\Policies;

use App\Models\Player;
use App\Support\SuperAdmin;

class PlayerPolicy
{
    public function update(Player $authUser, Player $target): bool
    {
        return $authUser->id === $target->id || SuperAdmin::check($authUser);
    }

    public function delete(Player $authUser, Player $target): bool
    {
        return SuperAdmin::check($authUser);
    }


}
