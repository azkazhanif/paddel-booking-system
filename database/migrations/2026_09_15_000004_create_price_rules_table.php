<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('court_id')->constrained()->cascadeOnDelete();
            $table->string('label', 20);
            $table->json('days_of_week');
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedInteger('price');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['court_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_rules');
    }
};
