<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Booking walk-in yang dibuat admin/owner di tempat sering tanpa email —
 * invoice & e-ticket cukup diserahkan langsung, jadi kolomnya dibuat opsional.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('customer_email')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('customer_email')->nullable(false)->change();
        });
    }
};
