<?php

namespace Tests\Feature\Admin;

use App\Models\Booking;
use App\Models\Court;
use App\Models\OperatingHour;
use App\Models\Setting;
use App\Models\User;
use Carbon\CarbonInterface;
use Database\Seeders\OperatingHourSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SettingTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(OperatingHourSeeder::class);
        $this->seed(SettingSeeder::class);

        $this->owner = User::factory()->owner()->create();
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function payload(array $overrides = []): array
    {
        return [
            'venue' => [
                'name' => 'PBS Padel Club',
                'address' => 'Jl. Contoh Raya No. 1',
                'whatsapp' => '6281200000000',
                'lat' => -6.2,
                'lng' => 106.8,
                'instagram' => 'https://instagram.com/pbs',
                'tiktok' => null,
            ],
            'booking' => [
                'slot_duration_minutes' => 60,
                'max_slots_per_booking' => 3,
                'advance_days' => 60,
                'hold_minutes' => 20,
                'max_pending_per_user' => 2,
                'cancel_before_hours' => 12,
                'service_fee' => 5000,
            ],
            'guest' => ['enabled' => true, 'max_bookings_per_ip_hour' => 5],
            'dp' => [
                'enabled' => true,
                'percentage' => 40,
                'min_days_ahead' => 1,
                'settle_before_hours' => 3,
                'no_show_grace_minutes' => 20,
                'max_unsettled_per_user' => 2,
                'refundable_before_hours' => 24,
            ],
            'reminder' => ['play_lead_minutes' => 90],
            'invoice' => ['company_name' => 'PBS Padel', 'tax_id' => '12.345', 'footer_note' => 'Terima kasih.'],
            'hours' => collect(range(1, 7))
                ->map(fn (int $day) => [
                    'day_of_week' => $day,
                    'open_time' => '07:00',
                    'close_time' => '22:00',
                    'is_closed' => $day === 1,
                ])
                ->all(),
            'closures' => ['2026-12-25'],
            ...$overrides,
        ];
    }

    public function test_owner_sees_the_current_settings(): void
    {
        $this->actingAs($this->owner)
            ->get(route('admin.settings.edit'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Settings/Edit')
                ->where('settings.dp.percentage', 30)
                ->where('settings.booking.advance_days', 90)
                ->has('hours', 7));
    }

    public function test_owner_can_save_settings_and_they_take_effect(): void
    {
        $this->actingAs($this->owner)
            ->put(route('admin.settings.update'), $this->payload())
            ->assertRedirect(route('admin.settings.edit'))
            ->assertSessionHasNoErrors();

        $this->assertSame(60, (int) Setting::get('booking.advance_days'));
        $this->assertSame(5000, (int) Setting::get('booking.service_fee'));
        $this->assertSame(40, (int) Setting::get('dp.percentage'));
        $this->assertSame(90, (int) Setting::get('reminder.play_lead_minutes'));
        $this->assertSame(['2026-12-25'], Setting::get('booking.closures'));
        $this->assertSame(-6.2, Setting::get('venue.coordinates')['lat']);

        $monday = OperatingHour::query()->where('day_of_week', 1)->firstOrFail();
        $this->assertTrue($monday->is_closed);
        $this->assertSame('07:00:00', $monday->open_time);
    }

    public function test_saved_policy_values_are_used_by_the_booking_form(): void
    {
        $court = Court::factory()->create();

        $this->actingAs($this->owner)->put(route('admin.settings.update'), $this->payload([
            'booking' => [
                'slot_duration_minutes' => 60,
                'max_slots_per_booking' => 2,
                'advance_days' => 7,
                'hold_minutes' => 20,
                'max_pending_per_user' => 2,
                'cancel_before_hours' => 12,
                'service_fee' => 5000,
            ],
        ]));

        $this->get(route('booking.create', ['court_id' => $court->id]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('limits.maxSlots', 2)
                ->where('limits.advanceDays', 7)
                ->where('limits.holdMinutes', 20)
                ->where('serviceFee', 5000));

        // Di luar jendela baru (H+7) booking ditolak server.
        $this->post(route('booking.store'), [
            'court_id' => $court->id,
            'date' => now(Booking::TIMEZONE)->addDays(10)->toDateString(),
            'slots' => ['08:00:00'],
            'customer_name' => 'Andre',
            'customer_email' => 'andre@example.com',
            'customer_email_confirmation' => 'andre@example.com',
            'customer_phone' => '081200000001',
            'players_count' => 4,
            'terms' => true,
        ])->assertSessionHasErrors('date');
    }

    public function test_closed_day_hides_all_slots(): void
    {
        $court = Court::factory()->create();

        $this->actingAs($this->owner)->put(route('admin.settings.update'), $this->payload());

        // Senin ditutup pada payload di atas.
        $monday = now(Booking::TIMEZONE)->next(CarbonInterface::MONDAY)->toDateString();

        $this->get(route('booking.create', ['court_id' => $court->id, 'date' => $monday]))
            ->assertInertia(fn (Assert $page) => $page->has('availability', 0));
    }

    public function test_invalid_values_are_rejected(): void
    {
        $this->actingAs($this->owner)
            ->put(route('admin.settings.update'), $this->payload([
                'dp' => [
                    'enabled' => true,
                    'percentage' => 150,
                    'min_days_ahead' => 1,
                    'settle_before_hours' => 3,
                    'no_show_grace_minutes' => 15,
                    'max_unsettled_per_user' => 2,
                    'refundable_before_hours' => 24,
                ],
            ]))
            ->assertSessionHasErrors('dp.percentage');

        $this->assertSame(30, (int) Setting::get('dp.percentage'));
    }

    public function test_only_owner_can_manage_settings(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get(route('admin.settings.edit'))->assertForbidden();
        $this->actingAs($admin)->put(route('admin.settings.update'), $this->payload())->assertForbidden();
        $this->actingAs(User::factory()->create())->get(route('admin.settings.edit'))->assertForbidden();
    }
}
