<?php

namespace Tests\Feature\Booking;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\ReminderChannel;
use App\Enums\ReminderType;
use App\Models\Booking;
use App\Models\Court;
use Carbon\CarbonImmutable;
use Database\Seeders\OperatingHourSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PlayReminderTest extends TestCase
{
    use RefreshDatabase;

    protected Court $court;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(OperatingHourSeeder::class);
        $this->seed(SettingSeeder::class);

        $this->court = Court::factory()->create(['name' => 'Court A']);

        config()->set('whatsapp.driver', 'fonnte');
        config()->set('whatsapp.token', 'fonnte-token-test');
        config()->set('whatsapp.base_url', 'https://api.fonnte.com');

        // Waktu dibekukan supaya jendela pengingat pasti.
        $this->travelTo(CarbonImmutable::parse('2026-10-05 09:00:00', Booking::TIMEZONE));
    }

    /**
     * Stub gateway didaftarkan per test (Http::fake yang dipanggil dua kali akan
     * menumpuk stub, bukan menggantinya).
     */
    protected function fakeFonnte(): void
    {
        Http::fake(['api.fonnte.com/send' => Http::response(['status' => true, 'id' => ['1']])]);
    }

    protected function booking(string $startTime, array $overrides = []): Booking
    {
        return Booking::factory()->create([
            'court_id' => $this->court->id,
            'customer_name' => 'Andre',
            'customer_phone' => '6281200000001',
            'date' => '2026-10-05',
            'start_time' => $startTime,
            'end_time' => date('H:i:s', strtotime($startTime) + 3600),
            ...$overrides,
        ]);
    }

    public function test_reminder_is_sent_one_hour_before_the_booking_starts(): void
    {
        $this->fakeFonnte();

        $booking = $this->booking('10:00:00');

        $this->artisan('bookings:remind-play')->assertSuccessful();

        Http::assertSent(function ($request) {
            return $request->url() === 'https://api.fonnte.com/send'
                && $request['target'] === '6281200000001'
                && str_contains($request['message'], 'Court A')
                && str_contains($request['message'], 'on time');
        });

        $this->assertTrue($booking->reminders()
            ->where('type', ReminderType::Play1h)
            ->where('channel', ReminderChannel::Whatsapp)
            ->exists());
    }

    public function test_reminder_is_not_sent_twice(): void
    {
        $this->fakeFonnte();

        $this->booking('10:00:00');

        $this->artisan('bookings:remind-play');
        $this->artisan('bookings:remind-play');

        Http::assertSentCount(1);
    }

    public function test_bookings_outside_the_window_are_skipped(): void
    {
        $this->fakeFonnte();

        $this->booking('15:00:00');

        $this->artisan('bookings:remind-play');

        Http::assertNothingSent();
    }

    public function test_unconfirmed_bookings_are_skipped(): void
    {
        $this->fakeFonnte();

        $this->booking('10:00:00', ['status' => BookingStatus::Pending]);
        $this->booking('10:30:00', ['status' => BookingStatus::Cancelled]);

        $this->artisan('bookings:remind-play');

        Http::assertNothingSent();
    }

    public function test_reminder_mentions_the_remaining_amount_for_a_dp_booking(): void
    {
        $this->fakeFonnte();

        $this->booking('10:00:00', ['payment_status' => PaymentStatus::DpPaid, 'paid_amount' => 90000, 'remaining_amount' => 210000]);

        $this->artisan('bookings:remind-play');

        Http::assertSent(fn ($request) => str_contains($request['message'], 'Rp210.000'));
    }

    public function test_log_driver_records_the_reminder_without_calling_the_gateway(): void
    {
        $this->fakeFonnte();

        config()->set('whatsapp.driver', 'log');

        $booking = $this->booking('10:00:00');

        $this->artisan('bookings:remind-play');

        Http::assertNothingSent();
        $this->assertTrue($booking->reminders()->where('type', ReminderType::Play1h)->exists());
    }

    public function test_failed_gateway_call_is_retried_on_the_next_run(): void
    {
        Http::fake(['api.fonnte.com/send' => Http::sequence()
            ->push(['status' => false, 'reason' => 'token invalid'], 200)
            ->push(['status' => true], 200)]);

        $booking = $this->booking('10:00:00');

        $this->artisan('bookings:remind-play');
        $this->assertSame(0, $booking->reminders()->count());

        $this->artisan('bookings:remind-play');
        $this->assertSame(1, $booking->reminders()->count());
    }
}
