<?php

namespace Tests\Feature\Booking;

use App\Enums\BookingStatus;
use App\Enums\CustomerType;
use App\Enums\PaymentOption;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\OperatingHourSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MemberBookingTest extends TestCase
{
    use RefreshDatabase;

    protected User $member;

    protected Court $court;

    protected string $date;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(OperatingHourSeeder::class);
        $this->seed(SettingSeeder::class);

        $this->member = User::factory()->create(['email' => 'member@example.com', 'phone' => '6281200000009']);
        $this->court = Court::factory()->create(['base_price' => 250000]);
        $this->date = now(Booking::TIMEZONE)->addDays(3)->toDateString();

        config()->set('midtrans.server_key', 'SB-Mid-server-test');
        config()->set('midtrans.client_key', 'SB-Mid-client-test');

        Http::fake([
            'app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
                'token' => 'snap-token-1',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v3/redirection/snap-token-1',
            ]),
            'api.sandbox.midtrans.com/v2/*/status' => Http::response(['transaction_status' => 'pending', 'status_code' => '201']),
        ]);
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
            'customer_name' => 'Rizky Pratama',
            'customer_phone' => '081200000009',
            'players_count' => 4,
            'terms' => true,
            ...$overrides,
        ];
    }

    protected function createBooking(array $overrides = []): Booking
    {
        $this->actingAs($this->member)->post(route('booking.store'), $this->payload($overrides))->assertRedirect();

        return Booking::query()->latest('id')->firstOrFail();
    }

    public function test_booking_form_is_prefilled_from_the_account(): void
    {
        $this->actingAs($this->member)
            ->get(route('booking.create'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Booking/Create')
                ->where('customer.email', 'member@example.com')
                ->where('customer.name', $this->member->name));
    }

    public function test_member_booking_is_linked_to_the_account(): void
    {
        $booking = $this->createBooking();

        $this->assertSame($this->member->id, $booking->user_id);
        $this->assertSame(CustomerType::Member, $booking->customer_type);
        // Email identitas diambil dari akun, bukan dari input client.
        $this->assertSame('member@example.com', $booking->customer_email);
        $this->assertSame(500000, $booking->total);
    }

    public function test_client_supplied_email_cannot_override_the_account_email(): void
    {
        $booking = $this->createBooking(['customer_email' => 'palsu@example.com']);

        $this->assertSame('member@example.com', $booking->customer_email);
    }

    public function test_checkout_offers_dp_to_an_eligible_member(): void
    {
        $booking = $this->createBooking();

        $this->actingAs($this->member)
            ->get(route('booking.checkout', $booking->code))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Booking/Checkout')
                ->where('dp.available', true)
                ->where('dp.percentage', 30)
                ->where('dp.amount', 150000));
    }

    public function test_member_can_pay_dp_and_the_amount_is_calculated_on_the_server(): void
    {
        $booking = $this->createBooking();

        $this->actingAs($this->member)
            ->postJson(route('booking.pay', $booking->code), ['payment_option' => 'dp'])
            ->assertOk()
            ->assertJson(['amount' => 150000, 'type' => 'dp']);

        $booking->refresh();

        $this->assertSame(PaymentOption::Dp, $booking->payment_option);
        $this->assertSame(30, $booking->dp_percentage);
        $this->assertSame(150000, $booking->dp_amount);
        $this->assertNotNull($booking->settlement_due_at);
        $this->assertSame(PaymentType::Dp, Payment::query()->firstOrFail()->type);
    }

    public function test_dp_is_rounded_up_to_the_nearest_thousand(): void
    {
        $this->court->update(['base_price' => 175500]);

        $booking = $this->createBooking(['slots' => ['08:00:00']]);

        $this->actingAs($this->member)
            ->postJson(route('booking.pay', $booking->code), ['payment_option' => 'dp'])
            ->assertOk()
            // 30% dari 175.500 = 52.650 → dibulatkan ke atas menjadi 53.000
            ->assertJson(['amount' => 53000]);
    }

    public function test_dp_is_not_available_for_a_same_day_booking(): void
    {
        // Waktu dibekukan agar slot yang dipilih selalu berada di dalam jam buka.
        $this->travelTo(CarbonImmutable::parse('2026-10-10 08:00:00', Booking::TIMEZONE));

        $booking = $this->createBooking([
            'date' => '2026-10-10',
            'slots' => ['10:00:00'],
        ]);

        $this->actingAs($this->member)
            ->postJson(route('booking.pay', $booking->code), ['payment_option' => 'dp'])
            ->assertStatus(422);

        $this->assertSame(PaymentOption::Full, $booking->refresh()->payment_option);
    }

    public function test_member_with_unverified_email_can_still_use_dp(): void
    {
        $this->member->forceFill(['email_verified_at' => null])->save();

        $this->assertTrue($this->member->refresh()->canUseDp());
    }

    public function test_member_cannot_exceed_the_unsettled_dp_limit(): void
    {
        Setting::set('dp.max_unsettled_per_user', 1);

        Booking::factory()->count(1)->create([
            'user_id' => $this->member->id,
            'court_id' => $this->court->id,
            'customer_type' => CustomerType::Member,
            'status' => BookingStatus::Confirmed,
            'payment_status' => PaymentStatus::DpPaid,
            'date' => $this->date,
        ]);

        $booking = $this->createBooking();

        $this->actingAs($this->member)
            ->postJson(route('booking.pay', $booking->code), ['payment_option' => 'dp'])
            ->assertStatus(422);
    }

    public function test_settlement_is_charged_for_the_remaining_amount_after_dp(): void
    {
        $booking = $this->createBooking();
        $booking->applyDpOption();
        $booking->recordOfflinePayment($booking->dp_amount, PaymentProvider::Cash, PaymentType::Dp, $this->member->id);

        $booking->refresh();
        $this->assertSame(PaymentStatus::DpPaid, $booking->payment_status);
        $this->assertSame(350000, $booking->remaining_amount);

        $this->actingAs($this->member)
            ->postJson(route('booking.pay', $booking->code), ['payment_option' => 'full'])
            ->assertOk()
            ->assertJson(['amount' => 350000, 'type' => 'settlement']);
    }

    public function test_status_page_shows_the_settlement_call_to_action(): void
    {
        $booking = $this->createBooking();
        $booking->applyDpOption();
        $booking->recordOfflinePayment($booking->dp_amount, PaymentProvider::Cash, PaymentType::Dp, $this->member->id);

        $this->actingAs($this->member)
            ->get(route('booking.status', $booking->code))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Booking/Status')
                ->where('booking.payment_status', PaymentStatus::DpPaid->value)
                ->where('booking.can_settle', true)
                ->where('booking.remaining_amount', 350000));
    }

    public function test_member_cannot_open_another_members_booking(): void
    {
        $booking = $this->createBooking();
        $other = User::factory()->create();

        $this->actingAs($other)->get(route('booking.status', $booking->code))->assertForbidden();
    }

    public function test_member_pending_booking_limit_is_enforced(): void
    {
        Setting::set('booking.max_pending_per_user', 1);

        $this->createBooking();

        $this->actingAs($this->member)
            ->post(route('booking.store'), $this->payload(['slots' => ['12:00:00']]))
            ->assertSessionHasErrors('slots');

        $this->assertSame(1, Booking::query()->count());
    }
}
