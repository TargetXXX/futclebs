<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('match_results', function (Blueprint $table) {
            $table->foreignId('match_id')
                ->primary()
                ->constrained('matches')
                ->cascadeOnDelete();

            $table->smallInteger('goals_team_a')->default(0);
            $table->smallInteger('goals_team_b')->default(0);

            $table->json('players_team_a')->nullable();
            $table->json('players_team_b')->nullable();
            $table->foreignId('tournament_id')
                ->nullable()
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('team_a_id')
                ->nullable()
                ->constrained('teams')
                ->cascadeOnDelete();

            $table->foreignId('team_b_id')
                ->nullable()
                ->constrained('teams')
                ->cascadeOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('match_results');
    }
};
