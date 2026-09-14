<?php

namespace Database\Seeders;

use App\Models\Court;
use Illuminate\Database\Seeder;

class PriceRuleSeeder extends Seeder
{
    public function run(): void
    {
        $rules = [
            ['label' => 'off_peak', 'days_of_week' => [1, 2, 3, 4, 5], 'start_time' => '06:00:00', 'end_time' => '16:00:00', 'price' => 250000],
            ['label' => 'peak', 'days_of_week' => [1, 2, 3, 4, 5], 'start_time' => '16:00:00', 'end_time' => '23:00:00', 'price' => 350000],
            ['label' => 'weekend', 'days_of_week' => [6, 7], 'start_time' => '06:00:00', 'end_time' => '23:00:00', 'price' => 400000],
        ];

        Court::query()->each(function (Court $court) use ($rules) {
            foreach ($rules as $rule) {
                $court->priceRules()->updateOrCreate(['label' => $rule['label']], [...$rule, 'is_active' => true]);
            }
        });
    }
}
