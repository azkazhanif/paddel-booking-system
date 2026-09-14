<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('code', 12)->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('court_id')->constrained()->restrictOnDelete();
            $table->foreignId('voucher_id')->nullable()->constrained()->nullOnDelete();

            $table->string('customer_type', 10);
            $table->string('customer_name', 100);
            $table->string('customer_email')->index();
            $table->string('customer_phone', 20);

            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedTinyInteger('players_count')->default(4);
            $table->text('notes')->nullable();

            $table->unsignedInteger('subtotal');
            $table->unsignedInteger('discount')->default(0);
            $table->unsignedInteger('service_fee')->default(0);
            $table->unsignedInteger('total');

            $table->string('payment_option', 10)->default('full');
            $table->unsignedTinyInteger('dp_percentage')->nullable();
            $table->unsignedInteger('dp_amount')->default(0);
            $table->unsignedInteger('paid_amount')->default(0);
            $table->unsignedInteger('remaining_amount');
            $table->timestamp('settlement_due_at')->nullable();

            $table->string('status', 20)->default('pending');
            $table->string('payment_status', 20)->default('unpaid');
            $table->string('source', 10)->default('online');

            $table->timestamp('expires_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('checked_in_at')->nullable();
            $table->foreignId('checked_in_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('cancel_reason')->nullable();
            $table->string('refund_status', 20)->default('none');
            $table->unsignedInteger('refund_amount')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('anonymized_at')->nullable();
            $table->timestamps();

            $table->index(['date', 'court_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index(['status', 'expires_at']);
            $table->index(['payment_status', 'settlement_due_at']);
            $table->index(['ip_address', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
