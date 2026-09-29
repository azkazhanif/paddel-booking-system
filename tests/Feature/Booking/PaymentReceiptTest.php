<?php

namespace Tests\Feature\Booking;

use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\ReminderType;
use App\Mail\PaymentReceiptMail;
use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use Database\Seeders\OperatingHourSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PaymentReceiptTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(OperatingHourSeeder::class);
        $this->seed(SettingSeeder::class);

        Mail::fake();

        $this->admin = User::factory()->admin()->create();
    }

    protected function unpaidBooking(array $overrides = []): Booking
    {
        return Booking::factory()->create([
            'court_id' => Court::factory(),
            'customer_email' => 'andre@example.com',
            'total' => 300000,
            'paid_amount' => 0,
            'remaining_amount' => 300000,
            'payment_status' => PaymentStatus::Unpaid,
            ...$overrides,
        ]);
    }

    public function test_receipt_is_sent_when_a_booking_is_fully_paid(): void
    {
        $booking = $this->unpaidBooking();

        $booking->recordOfflinePayment(300000, PaymentProvider::Cash, PaymentType::Full, $this->admin->id);

        Mail::assertQueued(PaymentReceiptMail::class, fn (PaymentReceiptMail $mail) => $mail->hasTo('andre@example.com')
            && $mail->booking->is($booking));

        $this->assertTrue($booking->reminders()->where('type', ReminderType::PaymentPaid)->exists());
    }

    public function test_receipt_is_sent_only_once_per_payment_stage(): void
    {
        $booking = $this->unpaidBooking();

        $booking->recordOfflinePayment(300000, PaymentProvider::Cash, PaymentType::Full, $this->admin->id);
        // Webhook ganda / sinkronisasi ulang tidak boleh mengirim email lagi.
        $booking->syncFromPayments();
        $booking->syncFromPayments();

        Mail::assertQueuedCount(1);
    }

    public function test_dp_and_settlement_each_get_their_own_receipt(): void
    {
        $booking = $this->unpaidBooking();

        $booking->recordOfflinePayment(90000, PaymentProvider::Cash, PaymentType::Dp, $this->admin->id);
        $this->assertSame(PaymentStatus::DpPaid, $booking->refresh()->payment_status);

        $booking->recordOfflinePayment(210000, PaymentProvider::Cash, PaymentType::Settlement, $this->admin->id);
        $this->assertSame(PaymentStatus::Paid, $booking->refresh()->payment_status);

        Mail::assertQueuedCount(2);
        $this->assertTrue($booking->reminders()->where('type', ReminderType::PaymentDp)->exists());
        $this->assertTrue($booking->reminders()->where('type', ReminderType::PaymentPaid)->exists());
    }

    public function test_no_receipt_is_sent_for_a_booking_without_an_email(): void
    {
        $booking = $this->unpaidBooking(['customer_email' => null]);

        $booking->recordOfflinePayment(300000, PaymentProvider::Cash, PaymentType::Full, $this->admin->id);

        Mail::assertNothingQueued();
    }

    public function test_receipt_renders_with_booking_details(): void
    {
        $booking = $this->unpaidBooking();
        $booking->recordOfflinePayment(300000, PaymentProvider::Cash, PaymentType::Full, $this->admin->id);

        $rendered = (new PaymentReceiptMail($booking->refresh()))->render();

        $this->assertStringContainsString($booking->code, $rendered);
        $this->assertStringContainsString('Rp300.000', $rendered);
    }
}
