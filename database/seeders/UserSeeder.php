<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $password = env('SEED_USER_PASSWORD', 'password');

        $accounts = [
            ['Owner PBS', 'owner@pbs.test', UserRole::Owner],
            ['Admin PBS', 'admin@pbs.test', UserRole::Admin],
            ['Staff PBS', 'staff@pbs.test', UserRole::Staff],
        ];

        foreach ($accounts as [$name, $email, $role]) {
            User::query()->updateOrCreate(['email' => $email], [
                'name' => $name,
                'role' => $role,
                'password' => $password,
                'is_blocked' => false,
            ])->forceFill(['email_verified_at' => now()])->save();
        }
    }
}
