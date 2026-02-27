<?php

namespace Database\Seeders;

use App\Models\Player;
use Illuminate\Database\Seeder;

class SystemAdminSeeder extends Seeder
{
    public function run(): void
    {
        Player::updateOrCreate(
            ['phone' => '44444444444'],
            [
                'name' => 'futclebs',
                'username' => 'futclebs',
                'email' => 'futclebs@gmail.com',
                'password' => 'futclebsrominhosafado123',
                'is_admin' => true,
                'is_active' => true,
                'is_verified' => true,
            ]
        );
    }
}
