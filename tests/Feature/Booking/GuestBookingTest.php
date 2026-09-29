<?php

namespace Tests\Feature\Booking;

use App\Enums\BookingSource;
use App\Enums\BookingStatus;
use App\Enums\CustomerType;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\OperatingHourSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GuestBookingTest extends TestCase
{
    use RefreshDatabase;

    protected Court $court;

    protected string $date;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(OperatingHourSeeder::class);
        $this->seed(SettingSeeder::class);

        $this->court = Court::factory()->create(['base_price' => 250000]);
        $this->date = now(Booking::TIMEZONE)->addDay()->toDateString();

        config()->set('midtrans.server_key', 'SB-Mid-server-test');
        config()->set('midtrans.client_key', 'SB-Mid-client-test');
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function payload(array $overrides = []): array
    {
        return [
            'court_id' => $this->court->id,
            'date' => $this->date,
            'slots' => ['08:00:00', '09:00:00'],
            'customer_name' => 'Andre Wijaya',
            'customer_email' => 'andre@example.com',
            'customer_email_confirmation' => 'andre@example.com',
            'customer_phone' => '081200000001',
            'players_count' => 4,
            'notes' => null,
            'terms' => true,
            ...$overrides,
        ];
    }

    protected function fakeSnap(): void
    {
        Http::fake([
            'app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
                'token' => 'snap-token-1',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v3/redirection/snap-token-1',
            ]),
            'api.sandbox.midtrans.com/v2/*/status' => Http::response(['transaction_status' => 'pending', 'status_code' => '201']),
        ]);
    }

    public function test_booking_page_shows_courts_and_server_side_prices(): void
    {
        $this->get(route('booking.create', ['court_id' => $this->court->id, 'date' => $this->date]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Booking/Create')
                ->where('selected.date', $this->date)
                ->where('courts.0.id', $this->court->id)
                ->where('availability.0.price', 250000)
                ->where('availability.0.status', 'available')
                ->where('customer', null));
    }

    public function test_guest_can_book_without_an_account(): void
    {
        $this->post(route('booking.store'), $this->payload())->assertRedirect();

        $booking = Booking::query()->firstOrFail();

        $this->assertSame(CustomerType::Guest, $booking->customer_type);
        $this->assertSame(BookingSource::Online, $booking->source);
        $this->assertSame(BookingStatus::Pending, $booking->status);
        $this->assertSame(PaymentStatus::Unpaid, $booking->payment_status);
        $this->assertNull($booking->user_id);
        $this->assertSame(500000, $booking->total);
        $this->assertSame(500000, $booking->remaining_amount);
        $this->assertSame('andre@example.com', $booking->customer_email);
        $this->assertSame('6281200000001', $booking->customer_phone);
        $this->assertNotNull($booking->expires_at);
        $this->assertCount(2, $booking->items);
    }

    public function test_price_is_recalculated_on_the_server(): void
    {
        $this->post(route('booking.store'), $this->payload(['total' => 1, 'subtotal' => 1]))->assertRedirect();

        $this->assertSame(500000, Booking::query()->firstOrFail()->total);
    }

    public function test_guest_email_must_be_confirmed(): void
    {
        $this->post(route('booking.store'), $this->payload(['customer_email_confirmation' => 'salah@example.com']))
            ->assertSessionHasErrors('customer_email');

        $this->assertSame(0, Booking::query()->count());
    }

    public function test_terms_must_be_accepted(): void
    {
        $this->post(route('booking.store'), $this->payload(['terms' => false]))->assertSessionHasErrors('terms');
    }

    public function test_slots_must_be_contiguous_and_still_available(): void
    {
        $this->post(route('booking.store'), $this->payload(['slots' => ['08:00:00', '11:00:00']]))
            ->assertSessionHasErrors('slots');

        $this->post(route('booking.store'), $this->payload())->assertRedirect();

        $this->post(route('booking.store'), $this->payload(['customer_email' => 'lain@example.com', 'customer_email_confirmation' => 'lain@example.com', 'slots' => ['09:00:00']]))
            ->assertSessionHasErrors('slots');

        $this->assertSame(1, Booking::query()->count());
    }

    public function test_guest_may_only_hold_one_pending_booking_per_email(): void
    {
        $this->post(route('booking.store'), $this->payload())->assertRedirect();

        $this->post(route('booking.store'), $this->payload(['slots' => ['12:00:00']]))
            ->assertSessionHasErrors('customer_email');
    }

    public function test_checkout_is_only_reachable_by_the_booking_owner(): void
    {
        $this->post(route('booking.store'), $this->payload());
        $booking = Booking::query()->firstOrFail();

        $this->get(route('booking.checkout', $booking->code))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Booking/Checkout')
                ->where('booking.code', $booking->code)
                ->where('dp.available', false)
                ->where('dp.reason', 'Khusus member. Daftar gratis untuk bisa bayar DP.'));

        // Sesi lain (pengunjung lain) tidak boleh membuka booking ini.
        $this->flushSession();

        $this->get(route('booking.checkout', $booking->code))->assertForbidden();
        $this->get(route('booking.status', $booking->code))->assertForbidden();
    }

    public function test_signed_guest_link_grants_access_to_the_booking(): void
    {
        $this->post(route('booking.store'), $this->payload());
        $booking = Booking::query()->firstOrFail();
        $link = $booking->guestUrl();

        $this->flushSession();

        $this->get($link)->assertRedirect(route('booking.checkout', $booking->code));
        $this->get(route('booking.checkout', $booking->code))->assertOk();
    }

    public function test_unsigned_guest_link_is_rejected(): void
    {
        $this->post(route('booking.store'), $this->payload());
        $booking = Booking::query()->firstOrFail();

        $this->flushSession();

        $this->get(route('booking.guest.show', $booking->code))->assertForbidden();
    }

    public function test_guest_payment_creates_a_full_snap_transaction(): void
    {
        $this->fakeSnap();

        $this->post(route('booking.store'), $this->payload());
        $booking = Booking::query()->firstOrFail();

        $this->postJson(route('booking.pay', $booking->code), ['payment_option' => 'full'])
            ->assertOk()
            ->assertJson(['token' => 'snap-token-1', 'amount' => 500000, 'type' => 'full']);

        $payment = Payment::query()->firstOrFail();

        $this->assertSame(PaymentType::Full, $payment->type);
        $this->assertSame(500000, $payment->amount);
        $this->assertSame('snap-token-1', $payment->snap_token);
    }

    public function test_repeated_pay_requests_reuse_the_open_snap_transaction(): void
    {
        $this->fakeSnap();

        $this->post(route('booking.store'), $this->payload());
        $booking = Booking::query()->firstOrFail();

        $this->postJson(route('booking.pay', $booking->code), ['payment_option' => 'full'])->assertOk();
        $this->postJson(route('booking.pay', $booking->code), ['payment_option' => 'full'])->assertOk();

        $this->assertSame(1, Payment::query()->count());
    }

    public function test_guest_cannot_choose_dp(): void
    {
        $this->fakeSnap();

        $this->post(route('booking.store'), $this->payload());
        $booking = Booking::query()->firstOrFail();

        $this->postJson(route('booking.pay', $booking->code), ['payment_option' => 'dp'])
            ->assertStatus(422);

        $this->assertSame(0, Payment::query()->count());
        $this->assertSame(0, $booking->refresh()->dp_amount);
    }

    public function test_expired_booking_releases_its_slots(): void
    {
        $this->post(route('booking.store'), $this->payload());
        $booking = Booking::query()->firstOrFail();

        $this->travel(20)->minutes();

        $this->get(route('booking.status', $booking->code))
            ->assertInertia(fn (Assert $page) => $page->where('booking.status', BookingStatus::Expired->value));

        $this->assertSame(BookingStatus::Expired, $booking->refresh()->status);
        $this->assertNull($booking->items()->first()->is_active);

        // Slot yang sama bisa dipesan orang lain setelah dilepas.
        $this->flushSession();

        $this->post(route('booking.store'), $this->payload(['customer_email' => 'lain@example.com', 'customer_email_confirmation' => 'lain@example.com']))
            ->assertRedirect();

        $this->assertSame(2, Booking::query()->count());
    }

    public function test_booking_window_follows_the_advance_days_setting(): void
    {
        Setting::set('booking.advance_days', 90);

        $farDate = now(Booking::TIMEZONE)->addDays(60)->toDateString();
        $tooFar = now(Booking::TIMEZONE)->addDays(91)->toDateString();

        $this->get(route('booking.create', ['date' => $farDate]))
            ->assertInertia(fn (Assert $page) => $page->where('selected.date', $farDate)->where('limits.advanceDays', 90));

        $this->post(route('booking.store'), $this->payload(['date' => $farDate]))->assertRedirect();
        $this->assertSame($farDate, Booking::query()->firstOrFail()->date->toDateString());

        $this->flushSession();

        $this->post(route('booking.store'), $this->payload([
            'date' => $tooFar,
            'customer_email' => 'lain@example.com',
            'customer_email_confirmation' => 'lain@example.com',
        ]))->assertSessionHasErrors('date');
    }

    public function test_tomorrow_can_be_booked(): void
    {
        $tomorrow = now(Booking::TIMEZONE)->addDay()->toDateString();

        $this->post(route('booking.store'), $this->payload(['date' => $tomorrow]))->assertRedirect();

        $this->assertSame($tomorrow, Booking::query()->firstOrFail()->date->toDateString());
    }

    public function test_blocked_member_cannot_create_a_booking(): void
    {
        $blocked = User::factory()->blocked()->create();

        $this->actingAs($blocked)
            ->post(route('booking.store'), $this->payload())
            ->assertSessionHasErrors('slots');

        $this->assertSame(0, Booking::query()->count());
    }
}
