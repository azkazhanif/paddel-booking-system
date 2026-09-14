<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $password = env('SEED_USER_PASSWORD', 'password');

        foreach ([['Admin PBS', 'admin@pbs.test', 'admin'], ['Staff PBS', 'staff@pbs.test', 'staff']] as [$name, $email, $role]) {
            User::query()->firstOrCreate(['email' => $email], [
                'name' => $name,
                'role' => $role,
                'password' => $password,
            ])->forceFill(['email_verified_at' => now()])->save();
        }
    }
}
