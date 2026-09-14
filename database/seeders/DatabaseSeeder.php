<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            SettingSeeder::class,
            OperatingHourSeeder::class,
            CourtSeeder::class,
            PriceRuleSeeder::class,
            FaqSeeder::class,
        ]);

        if (! app()->isProduction()) {
            $this->call(TestimonialSeeder::class);
        }
    }
}
