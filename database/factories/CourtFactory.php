<?php

namespace Database\Factories;

use App\Models\Court;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Court>
 */
class CourtFactory extends Factory
{
    public function definition(): array
    {
        $name = 'Court '.fake()->unique()->numberBetween(1, 999);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'type' => fake()->randomElement(['indoor', 'outdoor']),
            'surface' => 'Artificial grass',
            'description' => fake()->sentence(),
            'facilities' => ['LED lighting'],
            'base_price' => 250000,
            'is_active' => true,
            'sort_order' => 1,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
