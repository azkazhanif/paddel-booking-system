<?php

namespace Tests\Feature\Admin;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use Database\Seeders\OperatingHourSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ActivityLogTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected Court $court;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(OperatingHourSeeder::class);
        $this->seed(SettingSeeder::class);

        $this->admin = User::factory()->admin()->create();
        $this->court = Court::factory()->create();
    }

    public function test_offline_payment_is_logged_with_its_amount(): void
    {
        $booking = Booking::factory()->create([
            'court_id' => $this->court->id,
            'paid_amount' => 0,
            'remaining_amount' => 300000,
            'payment_status' => PaymentStatus::Unpaid,
        ]);

        $this->actingAs($this->admin)
            ->post(route('admin.bookings.payment.store', $booking), ['amount' => 300000, 'provider' => 'cash']);

        $log = ActivityLog::query()->where('action', 'payment.recorded')->firstOrFail();

        $this->assertSame($this->admin->id, $log->user_id);
        $this->assertSame(300000, $log->properties['amount']);
        $this->assertSame($booking->id, $log->subject_id);
    }

    public function test_cancellation_and_check_in_are_logged(): void
    {
        $booking = Booking::factory()->create([
            'court_id' => $this->court->id,
            'date' => now(Booking::TIMEZONE)->toDateString(),
            'start_time' => now(Booking::TIMEZONE)->addHours(2)->format('H:00:00'),
            'end_time' => now(Booking::TIMEZONE)->addHours(3)->format('H:00:00'),
            'status' => BookingStatus::Confirmed,
        ]);

        $this->actingAs($this->admin)->post(route('staff.check-in', $booking->code));
        $this->assertTrue(ActivityLog::query()->where('action', 'booking.checked_in')->exists());

        $other = Booking::factory()->create(['court_id' => $this->court->id, 'status' => BookingStatus::Confirmed]);

        $this->actingAs($this->admin)->post(route('admin.bookings.cancel', $other), ['reason' => 'Lapangan rusak']);

        $log = ActivityLog::query()->where('action', 'booking.cancelled')->firstOrFail();
        $this->assertSame('Lapangan rusak', $log->properties['reason']);
    }

    public function test_settings_and_voucher_changes_are_logged(): void
    {
        $owner = User::factory()->owner()->create();

        $this->actingAs($owner)->post(route('admin.vouchers.store'), [
            'code' => 'LOGTEST',
            'type' => 'fixed',
            'value' => 25000,
            'min_amount' => 0,
            'members_only' => false,
            'is_active' => true,
        ]);

        $this->assertTrue(ActivityLog::query()->where('action', 'voucher.saved')->exists());
    }

    public function test_log_page_is_owner_only_and_filterable(): void
    {
        ActivityLog::record('payment.recorded', null, ['amount' => 1000]);

        $owner = User::factory()->owner()->create();

        $this->actingAs($owner)
            ->get(route('admin.activity.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Activity/Index')
                ->has('logs.data', 1)
                ->where('logs.data.0.label', 'Pembayaran dicatat'));

        $this->actingAs($owner)
            ->get(route('admin.activity.index', ['action' => 'booking.cancelled']))
            ->assertInertia(fn (Assert $page) => $page->has('logs.data', 0));

        $this->actingAs($this->admin)->get(route('admin.activity.index'))->assertForbidden();
    }
}
