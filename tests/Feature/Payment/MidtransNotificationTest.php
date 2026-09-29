<?php

namespace Tests\Feature\Payment;

use App\Enums\BookingStatus;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\TransactionStatus;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\PaymentLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MidtransNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected const SERVER_KEY = 'SB-Mid-server-test';

    protected Booking $booking;

    protected Payment $payment;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('midtrans.server_key', self::SERVER_KEY);

        $this->booking = Booking::factory()->create([
            'total' => 500000,
            'paid_amount' => 0,
            'remaining_amount' => 500000,
            'status' => BookingStatus::Pending,
            'payment_status' => PaymentStatus::Unpaid,
        ]);

        $this->payment = $this->booking->payments()->create([
            'type' => PaymentType::Full,
            'provider' => PaymentProvider::Midtrans,
            'order_id' => 'PBS-ABC123-full-XYZ',
            'amount' => 500000,
            'status' => TransactionStatus::Pending,
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function notification(array $overrides = []): array
    {
        $payload = [
            'order_id' => $this->payment->order_id,
            'status_code' => '200',
            'gross_amount' => '500000.00',
            'transaction_status' => 'settlement',
            'payment_type' => 'qris',
            'transaction_id' => 'trx-1',
            ...$overrides,
        ];

        return [
            ...$payload,
            'signature_key' => hash('sha512', $payload['order_id'].$payload['status_code'].$payload['gross_amount'].self::SERVER_KEY),
            ...array_key_exists('signature_key', $overrides) ? ['signature_key' => $overrides['signature_key']] : [],
        ];
    }

    protected function fakeStatus(array $overrides = []): void
    {
        Http::fake([
            'api.sandbox.midtrans.com/v2/*/status' => Http::response([
                'order_id' => $this->payment->order_id,
                'status_code' => '200',
                'gross_amount' => '500000.00',
                'transaction_status' => 'settlement',
                'payment_type' => 'qris',
                'transaction_id' => 'trx-1',
                'settlement_time' => now()->format('Y-m-d H:i:s'),
                ...$overrides,
            ]),
        ]);
    }

    public function test_valid_notification_settles_the_payment_and_confirms_the_booking(): void
    {
        $this->fakeStatus();

        $this->postJson(route('midtrans.notification'), $this->notification())->assertOk();

        $this->assertSame(TransactionStatus::Settlement, $this->payment->refresh()->status);

        $booking = $this->booking->refresh();
        $this->assertSame(PaymentStatus::Paid, $booking->payment_status);
        $this->assertSame(BookingStatus::Confirmed, $booking->status);
        $this->assertSame(500000, $booking->paid_amount);
        $this->assertSame(0, $booking->remaining_amount);
    }

    public function test_invalid_signature_is_rejected(): void
    {
        Http::fake();

        $this->postJson(route('midtrans.notification'), $this->notification(['signature_key' => 'palsu']))->assertForbidden();

        $this->assertSame(TransactionStatus::Pending, $this->payment->refresh()->status);
        $this->assertSame(PaymentStatus::Unpaid, $this->booking->refresh()->payment_status);
        Http::assertNothingSent();
    }

    public function test_duplicate_notification_does_not_double_count_the_payment(): void
    {
        $this->fakeStatus();

        $this->postJson(route('midtrans.notification'), $this->notification())->assertOk();
        $this->postJson(route('midtrans.notification'), $this->notification())->assertOk();

        $this->assertSame(1, $this->booking->payments()->settled()->count());
        $this->assertSame(500000, $this->booking->refresh()->paid_amount);
    }

    public function test_amount_mismatch_does_not_confirm_the_booking(): void
    {
        $this->fakeStatus(['gross_amount' => '10000.00']);

        $this->postJson(route('midtrans.notification'), $this->notification())->assertOk();

        $this->assertSame(TransactionStatus::Pending, $this->payment->refresh()->status);
        $this->assertSame(PaymentStatus::Unpaid, $this->booking->refresh()->payment_status);
        $this->assertTrue(PaymentLog::query()->where('event', 'amount_mismatch')->exists());
    }

    public function test_expired_transaction_marks_the_payment_expired(): void
    {
        $this->fakeStatus(['transaction_status' => 'expire']);

        $this->postJson(route('midtrans.notification'), $this->notification(['transaction_status' => 'expire']))->assertOk();

        $this->assertSame(TransactionStatus::Expired, $this->payment->refresh()->status);
        $this->assertSame(BookingStatus::Pending, $this->booking->refresh()->status);
    }

    public function test_unknown_order_returns_not_found(): void
    {
        Http::fake();

        $this->postJson(route('midtrans.notification'), $this->notification(['order_id' => 'PBS-NOPE-full-XYZ']))->assertNotFound();
    }
}
