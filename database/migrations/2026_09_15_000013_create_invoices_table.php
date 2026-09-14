<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->unique()->constrained()->restrictOnDelete();
            $table->string('number', 30)->unique();
            $table->string('status', 10)->default('unpaid');
            $table->string('billed_name', 100);
            $table->string('billed_email');
            $table->string('billed_phone', 20);
            $table->unsignedInteger('subtotal');
            $table->unsignedInteger('discount')->default(0);
            $table->unsignedInteger('service_fee')->default(0);
            $table->unsignedInteger('total');
            $table->unsignedInteger('paid_amount')->default(0);
            $table->unsignedInteger('remaining_amount');
            $table->timestamp('issued_at');
            $table->timestamp('paid_at')->nullable();
            $table->string('pdf_path')->nullable();
            $table->timestamp('last_sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
