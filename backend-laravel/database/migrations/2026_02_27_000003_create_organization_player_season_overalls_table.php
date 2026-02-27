<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('organization_player_season_overalls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('player_id')->constrained('players')->cascadeOnDelete();
            $table->foreignId('organization_season_id')->nullable()->constrained('organization_seasons')->nullOnDelete();
            $table->string('season_reference');
            $table->unsignedTinyInteger('overall');
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->unique(['organization_id', 'player_id', 'season_reference'], 'org_player_season_reference_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_player_season_overalls');
    }
};
