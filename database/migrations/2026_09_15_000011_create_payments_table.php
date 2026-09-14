<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->restrictOnDelete();
            $table->string('type', 20);
            $table->string('provider', 20)->default('midtrans');
            $table->string('order_id', 50)->unique();
            $table->unsignedInteger('amount');
            $table->string('status', 20)->default('pending');
            $table->string('snap_token', 100)->nullable();
            $table->string('snap_redirect_url')->nullable();
            $table->string('transaction_id', 100)->nullable()->index();
            $table->string('payment_method', 50)->nullable();
            $table->string('fraud_status', 20)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('raw_response')->nullable();
            $table->timestamps();

            $table->index(['booking_id', 'status']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
