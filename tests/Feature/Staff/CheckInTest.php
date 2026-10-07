<?php

namespace Tests\Feature\Staff;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\OperatingHourSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CheckInTest extends TestCase
{
    use RefreshDatabase;

    protected User $staff;

    protected Court $court;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(OperatingHourSeeder::class);
        $this->seed(SettingSeeder::class);

        $this->staff = User::factory()->staff()->create();
        $this->court = Court::factory()->create();

        $this->travelTo(CarbonImmutable::parse('2026-10-10 09:30:00', Booking::TIMEZONE));
    }

    protected function booking(array $overrides = []): Booking
    {
        return Booking::factory()->create([
            'court_id' => $this->court->id,
            'date' => '2026-10-10',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'status' => BookingStatus::Confirmed,
            ...$overrides,
        ]);
    }

    public function test_today_page_lists_bookings_with_their_check_in_state(): void
    {
        $this->booking(['customer_name' => 'Rina']);
        $this->booking(['date' => '2026-10-11', 'start_time' => '08:00:00', 'end_time' => '09:00:00']);

        $this->actingAs($this->staff)
            ->get(route('staff.today'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Staff/Today')
                ->has('bookings', 1)
                ->where('bookings.0.customer_name', 'Rina')
                ->where('bookings.0.check_in_blocker', null)
                ->where('summary.total', 1));
    }

    public function test_qr_link_opens_the_scan_page_and_check_in_works(): void
    {
        $booking = $this->booking();

        $this->actingAs($this->staff)
            ->get($booking->scanUrl())
            ->assertInertia(fn (Assert $page) => $page
                ->component('Staff/Scan')
                ->where('booking.code', $booking->code)
                ->where('booking.check_in_blocker', null));

        $this->actingAs($this->staff)
            ->post(route('staff.check-in', $booking->code))
            ->assertSessionHasNoErrors();

        $booking->refresh();

        $this->assertSame(BookingStatus::CheckedIn, $booking->status);
        $this->assertSame($this->staff->id, $booking->checked_in_by);
        $this->assertNotNull($booking->checked_in_at);
    }

    public function test_unsettled_booking_cannot_check_in(): void
    {
        $booking = $this->booking([
            'payment_status' => PaymentStatus::DpPaid,
            'paid_amount' => 90000,
            'remaining_amount' => 210000,
        ]);

        $this->actingAs($this->staff)
            ->from(route('staff.today'))
            ->post(route('staff.check-in', $booking->code))
            ->assertRedirect(route('staff.today'));

        $this->assertSame(BookingStatus::Confirmed, $booking->refresh()->status);
    }

    public function test_booking_for_another_day_cannot_check_in(): void
    {
        $booking = $this->booking(['date' => '2026-10-12']);

        $this->actingAs($this->staff)
            ->get($booking->scanUrl())
            ->assertInertia(fn (Assert $page) => $page->where('booking.check_in_blocker', 'Check-in hanya bisa dilakukan pada hari main.'));

        $this->actingAs($this->staff)->post(route('staff.check-in', $booking->code));

        $this->assertSame(BookingStatus::Confirmed, $booking->refresh()->status);
    }

    public function test_scan_link_must_be_signed_and_staff_only(): void
    {
        $booking = $this->booking();

        $this->actingAs($this->staff)->get(route('staff.scan', $booking->code))->assertForbidden();

        $this->actingAs(User::factory()->create())->get($booking->scanUrl())->assertForbidden();
        $this->actingAs(User::factory()->create())->get(route('staff.today'))->assertForbidden();
    }

    public function test_guests_are_sent_to_login(): void
    {
        $this->get(route('staff.today'))->assertRedirect(route('login'));
    }

    public function test_admin_and_owner_can_use_the_staff_screen_too(): void
    {
        $this->actingAs(User::factory()->admin()->create())->get(route('staff.today'))->assertOk();
        $this->actingAs(User::factory()->owner()->create())->get(route('staff.today'))->assertOk();
    }

    public function test_confirmed_booking_payload_carries_a_qr_code(): void
    {
        $booking = $this->booking();

        $this->assertStringStartsWith('data:image/svg+xml;base64,', $booking->qrCode());
    }
}
