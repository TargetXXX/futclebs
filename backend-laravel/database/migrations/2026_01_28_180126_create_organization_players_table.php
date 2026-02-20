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
        Schema::create('organization_players', function (Blueprint $table) {
            $table->id();

            $table->foreignId('organization_id')
                ->constrained('organizations')
                ->cascadeOnDelete();

            $table->foreignId('player_id')
                ->constrained('players')
                ->cascadeOnDelete();

            $table->boolean('is_admin')->default(false);

            $table->unsignedTinyInteger('velocidade')->default(60);
            $table->unsignedTinyInteger('finalizacao')->default(60);
            $table->unsignedTinyInteger('passe')->default(60);
            $table->unsignedTinyInteger('drible')->default(60);
            $table->unsignedTinyInteger('defesa')->default(60);
            $table->unsignedTinyInteger('fisico')->default(60);
            $table->unsignedTinyInteger('esportividade')->default(100);
            $table->unsignedTinyInteger('overall')->default(60);

            $table->timestamps();

            $table->unique(['organization_id', 'player_id']);
        });


    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organization_players');
    }
};
