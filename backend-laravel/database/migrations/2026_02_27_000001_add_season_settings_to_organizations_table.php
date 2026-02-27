<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->boolean('seasons_enabled')->default(false)->after('active');
            $table->unsignedSmallInteger('season_duration_days')->nullable()->after('seasons_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn(['seasons_enabled', 'season_duration_days']);
        });
    }
};
