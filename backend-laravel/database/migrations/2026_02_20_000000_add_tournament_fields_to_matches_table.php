<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->foreignId('tournament_id')
                ->nullable()
                ->after('organization_id')
                ->constrained('tournaments')
                ->nullOnDelete();

            $table->foreignId('team_a_id')
                ->nullable()
                ->after('status')
                ->constrained('teams')
                ->nullOnDelete();

            $table->foreignId('team_b_id')
                ->nullable()
                ->after('team_a_id')
                ->constrained('teams')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->dropForeign(['team_b_id']);
            $table->dropForeign(['team_a_id']);
            $table->dropForeign(['tournament_id']);

            $table->dropColumn(['team_b_id', 'team_a_id', 'tournament_id']);
        });
    }
};
