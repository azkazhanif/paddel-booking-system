<?php

namespace Tests\Feature\Home;

use App\Models\Booking;
use App\Models\Court;
use Carbon\CarbonImmutable;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HomePageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    public function test_homepage_renders_with_data_from_database(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Home')
                ->has('courts', 4)
                ->has('courts.0', fn (Assert $court) => $court
                    ->where('price_from', 250000)
                    ->has('today.available')
                    ->etc())
                ->where('pricing.off_peak', 250000)
                ->where('pricing.peak', 350000)
                ->where('pricing.weekend', 400000)
                ->where('stats.courts', 4)
                ->where('dpPercentage', 30)
                ->has('faqs', 4)
                ->has('testimonials', 6));
    }

    public function test_inactive_courts_are_hidden(): void
    {
        Court::query()->first()->update(['is_active' => false]);

        $this->get('/')->assertInertia(fn (Assert $page) => $page->has('courts', 3)->where('stats.courts', 3));
    }

    public function test_court_slots_reflect_bookings_and_past_hours(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-09-21 10:30', Booking::TIMEZONE));

        $court = Court::query()->first();
        $booking = Booking::query()->create([
            'code' => Booking::generateCode(),
            'court_id' => $court->id,
            'customer_type' => 'guest',
            'customer_name' => 'Andre',
            'customer_email' => 'andre@example.com',
            'customer_phone' => '6281300000000',
            'date' => '2026-09-21',
            'start_time' => '16:00:00',
            'end_time' => '17:00:00',
            'subtotal' => 350000,
            'total' => 350000,
            'remaining_amount' => 350000,
        ]);
        $booking->items()->create([
            'court_id' => $court->id,
            'date' => '2026-09-21',
            'start_time' => '16:00:00',
            'end_time' => '17:00:00',
            'price' => 350000,
        ]);

        $slots = collect($court->slotsOn(now()))->keyBy('start_time');

        $this->assertCount(17, $slots);
        $this->assertSame('past', $slots['10:00:00']['status']);
        $this->assertSame('available', $slots['11:00:00']['status']);
        $this->assertSame('booked', $slots['16:00:00']['status']);
        $this->assertSame('22:00:00', $slots->last()['start_time']);
    }
}
