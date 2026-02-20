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
        Schema::create('players', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->unique();
            $table->boolean('is_goalkeeper')->default(false);
            $table->string('primary_position')->nullable();
            $table->string('secondary_position')->nullable();
            $table->longText('avatar')->nullable();
            $table->string('status')->default('active');
            $table->string('email')->unique()->nullable();
            $table->string('username')->unique();
            $table->string('cpf')->nullable()->unique();
            $table->string('password');
            $table->boolean('is_admin')->default(false);
            $table->boolean('is_active')->default(true);
            $table->date('birthdate')->nullable();
            $table->string('gender')->nullable();
            $table->string('verification_code')->nullable();
            $table->timestamp('code_sent_at')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->rememberToken();
            $table->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('players');
    }
};
