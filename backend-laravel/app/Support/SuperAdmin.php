<?php

namespace App\Support;

use App\Models\Player;

class SuperAdmin
{
    public static function ids(): array
    {
        $ids = config('superadmin.player_ids', []);

        if (!is_array($ids)) {
            return [];
        }

        return array_values(array_unique(array_map('intval', array_filter($ids, fn ($id) => is_numeric($id)))));
    }

    public static function check(Player $player): bool
    {
        if ($player->is_admin) {
            return true;
        }

        return in_array((int) $player->id, self::ids(), true);
    }
}
