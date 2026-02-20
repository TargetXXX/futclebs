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
        Schema::create('matches', function (Blueprint $table) {
            $table->id();

            $table->foreignId('organization_id')
                ->constrained('organizations')
                ->cascadeOnDelete();

            $table->string('name')->default('Pelada');
            $table->dateTime('match_date');
            $table->smallInteger('min_ovr')->default(0);
            $table->string('description')->nullable();
            $table->smallInteger('player_limit')->default(22);
            $table->boolean('is_private')->default(false);
            $table->string('password')->nullable();

            $table->string('status')->default('scheduled');

            $table->timestamps();
        });


    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};
