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
        Schema::create('player_votes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('match_id')
                ->constrained('matches')
                ->cascadeOnDelete();

            $table->foreignId('organization_id')
                ->constrained('organizations')
                ->cascadeOnDelete();

            $table->foreignId('voter_id')
                ->constrained('players')
                ->cascadeOnDelete();

            $table->foreignId('target_player_id')
                ->constrained('players')
                ->cascadeOnDelete();

            $table->smallInteger('velocidade')->default(60);
            $table->smallInteger('finalizacao')->default(60);
            $table->smallInteger('passe')->default(60);
            $table->smallInteger('drible')->default(60);
            $table->smallInteger('defesa')->default(60);
            $table->smallInteger('fisico')->default(60);
            $table->smallInteger('esportividade')->default(100);

            $table->timestamps();

            $table->unique(['match_id', 'voter_id', 'target_player_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('player_votes');
    }
};
