<?php

namespace Tests\Feature\Booking;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\ReminderType;
use App\Mail\BookingExpiredMail;
use App\Mail\SettlementReminderMail;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Setting;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\OperatingHourSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class BookingLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected Court $court;

    protected User $member;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(OperatingHourSeeder::class);
        $this->seed(SettingSeeder::class);

        Mail::fake();

        $this->court = Court::factory()->create();
        $this->member = User::factory()->create();

        $this->travelTo(CarbonImmutable::parse('2026-10-10 12:00:00', Booking::TIMEZONE));
    }

    protected function booking(array $overrides = []): Booking
    {
        return Booking::factory()->forMember($this->member)->create([
            'court_id' => $this->court->id,
            'date' => '2026-10-10',
            ...$overrides,
        ]);
    }

    public function test_dp_booking_that_is_not_settled_becomes_no_show_after_the_grace_period(): void
    {
        $booking = $this->booking([
            'status' => BookingStatus::Confirmed,
            'payment_status' => PaymentStatus::DpPaid,
            'paid_amount' => 90000,
            'remaining_amount' => 210000,
            'start_time' => '11:00:00',
            'end_time' => '12:00:00',
        ]);

        $this->artisan('bookings:close')->assertSuccessful();

        $this->assertSame(BookingStatus::NoShow, $booking->refresh()->status);
        // DP tetap tercatat sebagai terbayar — uangnya hangus, bukan dikembalikan.
        $this->assertSame(90000, $booking->paid_amount);
    }

    public function test_no_show_is_not_applied_before_the_grace_period_ends(): void
    {
        $booking = $this->booking([
            'status' => BookingStatus::Confirmed,
            'payment_status' => PaymentStatus::DpPaid,
            'paid_amount' => 90000,
            'remaining_amount' => 210000,
            'start_time' => '11:50:00',
            'end_time' => '12:50:00',
        ]);

        $this->artisan('bookings:close');

        $this->assertSame(BookingStatus::Confirmed, $booking->refresh()->status);
    }

    public function test_paid_booking_is_closed_as_completed(): void
    {
        $checkedIn = $this->booking(['status' => BookingStatus::CheckedIn, 'start_time' => '09:00:00', 'end_time' => '10:00:00']);
        $confirmed = $this->booking(['status' => BookingStatus::Confirmed, 'start_time' => '10:00:00', 'end_time' => '11:00:00']);
        $later = $this->booking(['status' => BookingStatus::Confirmed, 'start_time' => '18:00:00', 'end_time' => '19:00:00']);

        $this->artisan('bookings:close');

        $this->assertSame(BookingStatus::Completed, $checkedIn->refresh()->status);
        $this->assertSame(BookingStatus::Completed, $confirmed->refresh()->status);
        $this->assertSame(BookingStatus::Confirmed, $later->refresh()->status);
    }

    public function test_repeated_no_shows_suspend_dp_access(): void
    {
        Setting::set('dp.no_show_limit', 2);

        $this->booking([
            'status' => BookingStatus::NoShow,
            'payment_status' => PaymentStatus::DpPaid,
            'date' => '2026-10-01',
            'start_time' => '07:00:00',
            'end_time' => '08:00:00',
        ]);

        $second = $this->booking([
            'status' => BookingStatus::Confirmed,
            'payment_status' => PaymentStatus::DpPaid,
            'paid_amount' => 90000,
            'remaining_amount' => 210000,
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
        ]);

        $this->artisan('bookings:close');

        $this->assertSame(BookingStatus::NoShow, $second->refresh()->status);
        $this->assertNotNull($this->member->refresh()->dp_suspended_until);
        $this->assertFalse($this->member->canUseDp());
    }

    public function test_settlement_reminders_are_sent_once_per_stage(): void
    {
        $booking = $this->booking([
            'status' => BookingStatus::Confirmed,
            'payment_status' => PaymentStatus::DpPaid,
            'paid_amount' => 90000,
            'remaining_amount' => 210000,
            'date' => '2026-10-11',
            'start_time' => '15:00:00',
            'end_time' => '16:00:00',
            'settlement_due_at' => CarbonImmutable::parse('2026-10-11 12:00:00', Booking::TIMEZONE)->utc(),
        ]);

        // Masih ~24 jam sebelum batas → tahap H-1.
        $this->artisan('bookings:remind-settlement');

        Mail::assertQueued(SettlementReminderMail::class, fn (SettlementReminderMail $mail) => $mail->booking->is($booking));
        Mail::assertQueuedCount(1);

        $this->artisan('bookings:remind-settlement');
        Mail::assertQueuedCount(1);

        // Enam jam sebelum batas → tahap terakhir.
        $this->travelTo(CarbonImmutable::parse('2026-10-11 07:00:00', Booking::TIMEZONE));
        $this->artisan('bookings:remind-settlement');

        Mail::assertQueuedCount(2);
        $this->assertTrue($booking->reminders()->where('type', ReminderType::SettlementH1)->exists());
        $this->assertTrue($booking->reminders()->where('type', ReminderType::Settlement6h)->exists());
    }

    public function test_settled_bookings_get_no_settlement_reminder(): void
    {
        $this->booking([
            'status' => BookingStatus::Confirmed,
            'payment_status' => PaymentStatus::Paid,
            'date' => '2026-10-11',
            'settlement_due_at' => CarbonImmutable::parse('2026-10-11 12:00:00', Booking::TIMEZONE)->utc(),
        ]);

        $this->artisan('bookings:remind-settlement');

        Mail::assertNothingQueued();
    }

    public function test_expired_booking_notifies_the_customer_once(): void
    {
        $booking = $this->booking([
            'status' => BookingStatus::Pending,
            'payment_status' => PaymentStatus::Unpaid,
            'paid_amount' => 0,
            'remaining_amount' => 300000,
            'date' => '2026-10-12',
            'expires_at' => now()->subMinute(),
        ]);

        Booking::expireStale();
        Booking::expireStale();

        $this->assertSame(BookingStatus::Expired, $booking->refresh()->status);
        Mail::assertQueued(BookingExpiredMail::class, fn (BookingExpiredMail $mail) => $mail->booking->is($booking));
        Mail::assertQueuedCount(1);
    }
}
