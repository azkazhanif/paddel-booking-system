<?php

namespace Database\Seeders;

use App\Models\OperatingHour;
use Illuminate\Database\Seeder;

class OperatingHourSeeder extends Seeder
{
    public function run(): void
    {
        foreach (range(1, 7) as $day) {
            OperatingHour::query()->updateOrCreate(
                ['day_of_week' => $day],
                ['open_time' => '06:00:00', 'close_time' => '23:00:00', 'is_closed' => false],
            );
        }
    }
}
