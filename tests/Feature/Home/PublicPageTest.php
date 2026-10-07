<?php

namespace Tests\Feature\Home;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Faq;
use App\Models\PriceRule;
use App\Models\Setting;
use App\Models\SlotBlock;
use Database\Seeders\OperatingHourSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicPageTest extends TestCase
{
    use RefreshDatabase;

    protected Court $court;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(OperatingHourSeeder::class);
        $this->seed(SettingSeeder::class);

        $this->court = Court::factory()->create(['name' => 'Court A', 'base_price' => 250000]);
    }

    public function test_every_informational_page_is_reachable(): void
    {
        $pages = [
            'courts.index' => 'Courts/Index',
            'schedule.index' => 'Schedule/Index',
            'pricing' => 'Pricing',
            'about' => 'About',
            'contact' => 'Contact',
            'faq' => 'Faq',
            'terms' => 'Legal/Terms',
            'privacy' => 'Legal/Privacy',
            'membership' => 'Membership',
        ];

        foreach ($pages as $name => $component) {
            $this->get(route($name))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page->component($component)->has('venue.name'));
        }
    }

    public function test_court_list_shows_availability_for_today(): void
    {
        $this->get(route('courts.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Courts/Index')
                ->where('courts.0.name', 'Court A')
                ->where('courts.0.price_from', 250000)
                ->has('courts.0.today.available'));
    }

    public function test_court_detail_lists_slots_and_prices(): void
    {
        $date = now(Booking::TIMEZONE)->addDay()->toDateString();

        $this->get(route('courts.show', ['court' => $this->court->slug, 'date' => $date]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Courts/Show')
                ->where('court.slug', $this->court->slug)
                ->where('selected.date', $date)
                ->where('availability.0.price', 250000));
    }

    public function test_inactive_court_is_hidden_from_the_public(): void
    {
        $hidden = Court::factory()->create(['is_active' => false]);

        $this->get(route('courts.index'))
            ->assertInertia(fn (Assert $page) => $page->has('courts', 1));

        $this->get(route('courts.show', ['court' => $hidden->slug]))->assertNotFound();
    }

    public function test_schedule_shows_every_court_with_blocked_slots_marked(): void
    {
        $date = now(Booking::TIMEZONE)->addDay()->toDateString();

        SlotBlock::create([
            'court_id' => $this->court->id,
            'date' => $date,
            'start_time' => '08:00:00',
            'end_time' => '09:00:00',
            'reason' => 'maintenance',
        ]);

        Court::factory()->create();

        $this->get(route('schedule.index', ['date' => $date]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Schedule/Index')
                ->where('selected.date', $date)
                ->has('schedule', 2)
                ->where('schedule.0.slots.2.status', 'blocked'));
    }

    public function test_pricing_page_lists_rules_per_court(): void
    {
        PriceRule::create([
            'court_id' => $this->court->id,
            'label' => 'peak',
            'days_of_week' => [1, 2, 3, 4, 5],
            'start_time' => '17:00:00',
            'end_time' => '22:00:00',
            'price' => 400000,
            'is_active' => true,
        ]);

        $this->get(route('pricing'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pricing')
                ->where('courts.0.base_price', 250000)
                ->where('courts.0.rules.0.price', 400000)
                ->where('policy.dp_percentage', 30));
    }

    public function test_faq_page_only_shows_published_entries(): void
    {
        Faq::create(['question' => 'Tampil?', 'answer' => 'Ya', 'is_published' => true, 'sort_order' => 1]);
        Faq::create(['question' => 'Rahasia?', 'answer' => 'Tidak', 'is_published' => false, 'sort_order' => 2]);

        $this->get(route('faq'))
            ->assertInertia(fn (Assert $page) => $page->has('faqs', 1)->where('faqs.0.question', 'Tampil?'));
    }

    public function test_legal_pages_follow_the_current_policy_settings(): void
    {
        Setting::set('booking.cancel_before_hours', 48);

        $this->get(route('terms'))
            ->assertInertia(fn (Assert $page) => $page->where('policy.cancel_before_hours', 48));
    }
}
