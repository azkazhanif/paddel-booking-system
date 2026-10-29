<?php

namespace Tests\Feature\Account;

use App\Enums\BookingStatus;
use App\Enums\CustomerType;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\RefundStatus;
use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\OperatingHourSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MyBookingTest extends TestCase
{
    use RefreshDatabase;

    protected User $member;

    protected Court $court;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(OperatingHourSeeder::class);
        $this->seed(SettingSeeder::class);

        $this->member = User::factory()->create(['email' => 'member@example.com']);
        $this->court = Court::factory()->create();
    }

    protected function booking(array $overrides = []): Booking
    {
        return Booking::factory()->forMember($this->member)->create([
            'court_id' => $this->court->id,
            ...$overrides,
        ]);
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get(route('my-bookings.index'))->assertRedirect(route('login'));
    }

    public function test_unverified_members_can_open_their_bookings(): void
    {
        $unverified = User::factory()->unverified()->create();

        $this->actingAs($unverified)->get(route('my-bookings.index'))->assertOk();
    }

    public function test_upcoming_tab_lists_active_bookings_with_their_actions(): void
    {
        $this->booking(['date' => now(Booking::TIMEZONE)->addDays(5)->toDateString()]);
        $this->booking(['status' => BookingStatus::Cancelled, 'date' => now(Booking::TIMEZONE)->addDays(6)->toDateString()]);

        $this->actingAs($this->member)
            ->get(route('my-bookings.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('MyBookings/Index')
                ->where('tab', 'upcoming')
                ->where('counts.upcoming', 1)
                ->where('counts.cancelled', 1)
                ->has('bookings', 1)
                ->where('bookings.0.can_cancel', true));
    }

    public function test_cancelled_tab_lists_cancelled_and_expired_bookings(): void
    {
        $this->booking(['status' => BookingStatus::Cancelled]);
        $this->booking(['status' => BookingStatus::Expired]);
        $this->booking();

        $this->actingAs($this->member)
            ->get(route('my-bookings.index', ['tab' => 'cancelled']))
            ->assertInertia(fn (Assert $page) => $page->has('bookings', 2));
    }

    public function test_past_tab_lists_finished_bookings(): void
    {
        $this->booking(['status' => BookingStatus::Completed, 'date' => now(Booking::TIMEZONE)->subDays(3)->toDateString()]);
        $this->booking();

        $this->actingAs($this->member)
            ->get(route('my-bookings.index', ['tab' => 'past']))
            ->assertInertia(fn (Assert $page) => $page->has('bookings', 1));
    }

    public function test_guest_bookings_with_the_same_email_are_claimed(): void
    {
        $guestBooking = Booking::factory()->create([
            'court_id' => $this->court->id,
            'customer_email' => 'member@example.com',
            'customer_type' => CustomerType::Guest,
        ]);

        $this->actingAs($this->member)->get(route('my-bookings.index'))->assertOk();

        $guestBooking->refresh();

        $this->assertSame($this->member->id, $guestBooking->user_id);
        $this->assertSame(CustomerType::Member, $guestBooking->customer_type);
    }

    public function test_unverified_email_does_not_claim_guest_bookings(): void
    {
        $unverified = User::factory()->unverified()->create(['email' => 'belum@example.com']);
        $guestBooking = Booking::factory()->create(['court_id' => $this->court->id, 'customer_email' => 'belum@example.com']);

        $this->assertSame(0, Booking::claimFor($unverified));
        $this->assertNull($guestBooking->refresh()->user_id);
    }

    public function test_detail_page_shows_payments_and_cannot_be_opened_by_others(): void
    {
        $booking = $this->booking(['payment_status' => PaymentStatus::DpPaid, 'paid_amount' => 90000, 'remaining_amount' => 210000]);
        $booking->recordOfflinePayment(90000, PaymentProvider::Cash, PaymentType::Dp, $this->member->id);

        $this->actingAs($this->member)
            ->get(route('my-bookings.show', $booking->code))
            ->assertInertia(fn (Assert $page) => $page
                ->component('MyBookings/Show')
                ->where('booking.code', $booking->code)
                ->where('booking.can_settle', true)
                ->has('payments', 1));

        $this->actingAs(User::factory()->create())
            ->get(route('my-bookings.show', $booking->code))
            ->assertForbidden();
    }

    public function test_member_can_cancel_a_booking_and_the_slot_is_released(): void
    {
        $booking = $this->booking([
            'date' => now(Booking::TIMEZONE)->addDays(5)->toDateString(),
            'status' => BookingStatus::Confirmed,
        ]);

        $this->actingAs($this->member)
            ->post(route('my-bookings.cancel', $booking->code), ['reason' => 'Ada acara lain'])
            ->assertRedirect(route('my-bookings.show', $booking->code));

        $booking->refresh();

        $this->assertSame(BookingStatus::Cancelled, $booking->status);
        $this->assertSame('Ada acara lain', $booking->cancel_reason);
        $this->assertSame($this->member->id, $booking->cancelled_by);
        $this->assertNull($booking->items()->first()->is_active);
        // Sudah lunas penuh → refund diajukan untuk ditinjau admin.
        $this->assertSame(RefundStatus::Requested, $booking->refund_status);
    }

    public function test_cancellation_is_rejected_inside_the_cutoff(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-10 08:00:00', Booking::TIMEZONE));

        $booking = $this->booking([
            'date' => '2026-10-10',
            'start_time' => '20:00:00',
            'end_time' => '21:00:00',
            'status' => BookingStatus::Confirmed,
        ]);

        $this->actingAs($this->member)
            ->from(route('my-bookings.show', $booking->code))
            ->post(route('my-bookings.cancel', $booking->code))
            ->assertRedirect(route('my-bookings.show', $booking->code));

        $this->assertSame(BookingStatus::Confirmed, $booking->refresh()->status);
    }

    public function test_pending_booking_can_always_be_cancelled_by_its_owner(): void
    {
        $booking = $this->booking([
            'status' => BookingStatus::Pending,
            'payment_status' => PaymentStatus::Unpaid,
            'paid_amount' => 0,
            'remaining_amount' => 300000,
            'date' => now(Booking::TIMEZONE)->toDateString(),
            'start_time' => now(Booking::TIMEZONE)->addHour()->format('H:00:00'),
            'end_time' => now(Booking::TIMEZONE)->addHours(2)->format('H:00:00'),
        ]);

        $this->actingAs($this->member)->post(route('my-bookings.cancel', $booking->code))->assertRedirect();

        $booking->refresh();

        $this->assertSame(BookingStatus::Cancelled, $booking->status);
        // Belum ada uang masuk → tidak ada refund yang perlu diproses.
        $this->assertSame(RefundStatus::None, $booking->refund_status);
    }

    public function test_dp_booking_cancelled_inside_the_refund_window_does_not_request_a_refund(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-10 08:00:00', Booking::TIMEZONE));

        $booking = $this->booking([
            'date' => '2026-10-11',
            'start_time' => '07:00:00',
            'end_time' => '08:00:00',
            'status' => BookingStatus::Confirmed,
        ]);
        $booking->applyDpOption();
        $booking->forceFill(['payment_status' => PaymentStatus::DpPaid, 'paid_amount' => 90000, 'remaining_amount' => 210000])->save();

        $this->actingAs($this->member)->post(route('my-bookings.cancel', $booking->code));

        // Jam main kurang dari 24 jam lagi → DP hangus (BR: DP tidak dikembalikan).
        $this->assertSame(RefundStatus::None, $booking->refresh()->refund_status);
    }
}
