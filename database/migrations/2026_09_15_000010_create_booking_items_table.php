<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('court_id')->constrained()->restrictOnDelete();
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedInteger('price');
            $table->string('price_label', 20)->nullable();
            $table->boolean('is_active')->nullable()->default(true);
            $table->timestamps();

            // Anti double booking: slot non-aktif bernilai NULL sehingga tidak bentrok
            $table->unique(['court_id', 'date', 'start_time', 'is_active'], 'booking_items_slot_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_items');
    }
};
