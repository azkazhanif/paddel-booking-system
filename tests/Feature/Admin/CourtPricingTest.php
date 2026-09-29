<?php

namespace Tests\Feature\Admin;

use App\Models\Court;
use App\Models\PriceRule;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\OperatingHourSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CourtPricingTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected Court $court;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(OperatingHourSeeder::class);
        $this->admin = User::factory()->admin()->create();
        $this->court = Court::factory()->create(['base_price' => 250000]);
    }

    public function test_page_shows_rules_and_weekly_preview(): void
    {
        $this->court->priceRules()->create([
            'label' => 'peak',
            'days_of_week' => [1, 2, 3, 4, 5],
            'start_time' => '16:00:00',
            'end_time' => '23:00:00',
            'price' => 350000,
            'is_active' => true,
        ]);

        $this->actingAs($this->admin)
            ->get(route('admin.courts.pricing', $this->court))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Courts/Pricing')
                ->where('court.base_price', 250000)
                ->has('rules', 1)
                ->where('rules.0.start_time', '16:00')
                ->has('preview.rows', 7)
                // Senin 17.00 kena aturan peak, 07.00 memakai harga dasar
                ->where('preview.rows.0.prices.'.array_search(17, $page->toArray()['props']['preview']['hours']), 350000)
                ->where('preview.rows.0.prices.'.array_search(7, $page->toArray()['props']['preview']['hours']), 250000));
    }

    public function test_update_creates_updates_and_deletes_rules(): void
    {
        $kept = $this->court->priceRules()->create([
            'label' => 'off_peak', 'days_of_week' => [1, 2], 'start_time' => '06:00:00', 'end_time' => '10:00:00', 'price' => 200000, 'is_active' => true,
        ]);
        $removed = $this->court->priceRules()->create([
            'label' => 'weekend', 'days_of_week' => [6, 7], 'start_time' => '06:00:00', 'end_time' => '23:00:00', 'price' => 400000, 'is_active' => true,
        ]);

        $this->actingAs($this->admin)
            ->put(route('admin.courts.pricing.update', $this->court), [
                'base_price' => 275000,
                'rules' => [
                    ['id' => $kept->id, 'label' => 'off_peak', 'days_of_week' => [1, 2, 3], 'start_time' => '06:00', 'end_time' => '11:00', 'price' => 225000, 'is_active' => true],
                    ['id' => null, 'label' => 'peak', 'days_of_week' => [1, 2, 3], 'start_time' => '17:00', 'end_time' => '22:00', 'price' => 375000, 'is_active' => true],
                ],
                'special_prices' => [],
            ])
            ->assertRedirect(route('admin.courts.pricing', $this->court))
            ->assertSessionHas('success');

        $this->assertSame(275000, $this->court->refresh()->base_price);
        $this->assertDatabaseMissing('price_rules', ['id' => $removed->id]);
        $this->assertSame(2, $this->court->priceRules()->count());

        $kept->refresh();
        $this->assertSame([1, 2, 3], $kept->days_of_week);
        $this->assertSame(225000, $kept->price);

        $newRule = $this->court->priceRules()->where('label', 'peak')->sole();
        $this->assertSame('17:00:00', $newRule->start_time);
        $this->assertSame(375000, $newRule->price);
    }

    public function test_price_actually_applies_after_update(): void
    {
        $monday = CarbonImmutable::now('Asia/Jakarta')->startOfWeek()->addWeek();

        $this->actingAs($this->admin)->put(route('admin.courts.pricing.update', $this->court), [
            'base_price' => 260000,
            'rules' => [['id' => null, 'label' => 'peak', 'days_of_week' => [1], 'start_time' => '18:00', 'end_time' => '22:00', 'price' => 390000, 'is_active' => true]],
            'special_prices' => [['id' => null, 'date' => $monday->toDateString(), 'start_time' => '', 'end_time' => '', 'price' => 500000, 'note' => 'Libur nasional']],
        ]);

        $court = Court::query()->with('priceRules')->findOrFail($this->court->id);

        $this->assertSame(500000, $court->priceAt($monday, '19:00:00'), 'harga khusus tanggal harus menang');
        $this->assertSame(390000, $court->priceAt($monday->addWeek(), '19:00:00'), 'aturan peak berlaku di Senin lain');
        $this->assertSame(260000, $court->priceAt($monday->addWeek(), '09:00:00'), 'di luar aturan memakai harga dasar');
    }

    public function test_overlapping_rules_are_rejected(): void
    {
        $this->actingAs($this->admin)
            ->put(route('admin.courts.pricing.update', $this->court), [
                'base_price' => 250000,
                'rules' => [
                    ['id' => null, 'label' => 'off_peak', 'days_of_week' => [1, 2], 'start_time' => '06:00', 'end_time' => '16:00', 'price' => 250000, 'is_active' => true],
                    ['id' => null, 'label' => 'peak', 'days_of_week' => [2, 3], 'start_time' => '15:00', 'end_time' => '22:00', 'price' => 350000, 'is_active' => true],
                ],
                'special_prices' => [],
            ])
            ->assertSessionHasErrors('rules.1.start_time');

        $this->assertSame(0, PriceRule::query()->count());
    }

    public function test_rules_of_other_courts_cannot_be_hijacked(): void
    {
        $other = Court::factory()->create();
        $foreign = $other->priceRules()->create([
            'label' => 'peak', 'days_of_week' => [1], 'start_time' => '16:00:00', 'end_time' => '22:00:00', 'price' => 300000, 'is_active' => true,
        ]);

        $this->actingAs($this->admin)
            ->put(route('admin.courts.pricing.update', $this->court), [
                'base_price' => 250000,
                'rules' => [['id' => $foreign->id, 'label' => 'peak', 'days_of_week' => [1], 'start_time' => '16:00', 'end_time' => '22:00', 'price' => 999000, 'is_active' => true]],
                'special_prices' => [],
            ])
            ->assertNotFound();

        $this->assertSame(300000, $foreign->refresh()->price);
    }

    public function test_end_time_must_be_after_start_time(): void
    {
        $this->actingAs($this->admin)
            ->put(route('admin.courts.pricing.update', $this->court), [
                'base_price' => 250000,
                'rules' => [['id' => null, 'label' => 'peak', 'days_of_week' => [1], 'start_time' => '20:00', 'end_time' => '18:00', 'price' => 350000, 'is_active' => true]],
                'special_prices' => [],
            ])
            ->assertSessionHasErrors('rules.0.end_time');
    }
}
