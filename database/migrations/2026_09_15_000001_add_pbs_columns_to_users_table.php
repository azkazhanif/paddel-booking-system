<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone', 20)->nullable()->index()->after('email');
            $table->string('avatar_path')->nullable()->after('phone');
            $table->string('role', 20)->default('customer')->index()->after('avatar_path');
            $table->boolean('is_blocked')->default(false)->after('role');
            $table->string('blocked_reason')->nullable()->after('is_blocked');
            $table->timestamp('dp_suspended_until')->nullable()->after('blocked_reason');
            $table->text('admin_notes')->nullable()->after('dp_suspended_until');
            $table->string('google_id')->nullable()->unique()->after('password');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['google_id']);
            $table->dropIndex(['phone']);
            $table->dropIndex(['role']);
            $table->dropColumn([
                'phone',
                'avatar_path',
                'role',
                'is_blocked',
                'blocked_reason',
                'dp_suspended_until',
                'admin_notes',
                'google_id',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable(false)->change();
        });
    }
};
