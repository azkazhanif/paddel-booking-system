<?php

namespace Database\Seeders;

use App\Models\Court;
use Illuminate\Database\Seeder;

class CourtSeeder extends Seeder
{
    public function run(): void
    {
        $courts = [
            [
                'name' => 'Court 1 — Panoramic',
                'slug' => 'court-1-panoramic',
                'type' => 'indoor',
                'surface' => 'Artificial grass',
                'description' => 'Lapangan indoor berdinding kaca panoramic dengan pencahayaan LED standar turnamen.',
                'facilities' => ['LED lighting', 'Panoramic glass', 'AC hall', 'Locker'],
            ],
            [
                'name' => 'Court 2 — Panoramic',
                'slug' => 'court-2-panoramic',
                'type' => 'indoor',
                'surface' => 'Artificial grass',
                'description' => 'Kembaran Court 1, cocok untuk sparring dan latihan intens tanpa terganggu cuaca.',
                'facilities' => ['LED lighting', 'Panoramic glass', 'AC hall', 'Shower'],
            ],
            [
                'name' => 'Court 3 — Garden',
                'slug' => 'court-3-garden',
                'type' => 'outdoor',
                'surface' => 'Textured grass',
                'description' => 'Lapangan outdoor dikelilingi taman, favorit untuk main pagi dan sore hari.',
                'facilities' => ['Floodlight', 'Shaded bench', 'Water station'],
            ],
            [
                'name' => 'Court 4 — Garden',
                'slug' => 'court-4-garden',
                'type' => 'outdoor',
                'surface' => 'Textured grass',
                'description' => 'Lapangan outdoor dengan tribun kecil, pas untuk main bareng komunitas.',
                'facilities' => ['Floodlight', 'Mini tribune', 'Water station'],
            ],
        ];

        foreach ($courts as $index => $data) {
            Court::query()->updateOrCreate(
                ['slug' => $data['slug']],
                [...$data, 'base_price' => 250000, 'is_active' => true, 'sort_order' => $index + 1],
            );
        }
    }
}
