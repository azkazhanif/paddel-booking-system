<?php

namespace Tests\Feature\Admin;

use App\Enums\BookingSource;
use App\Enums\BookingStatus;
use App\Enums\CustomerType;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\TransactionStatus;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Payment;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\OperatingHourSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WalkInBookingTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected Court $court;

    protected string $date;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(OperatingHourSeeder::class);
        $this->seed(SettingSeeder::class);

        $this->admin = User::factory()->admin()->create();
        $this->court = Court::factory()->create(['base_price' => 250000]);
        $this->date = now(Booking::TIMEZONE)->addDay()->toDateString();

        config()->set('midtrans.server_key', 'SB-Mid-server-test');
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
            'customer_name' => 'Rina Maharani',
            'customer_phone' => '081200000001',
            'customer_email' => null,
            'players_count' => 4,
            'notes' => null,
            'payment_method' => 'cash',
            ...$overrides,
        ];
    }

    public function test_create_page_shows_slots_with_server_side_prices(): void
    {
        $this->actingAs($this->admin)
            ->get(route('admin.bookings.create', ['court_id' => $this->court->id, 'date' => $this->date]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Bookings/Create')
                ->where('selected.date', $this->date)
                ->where('availability.0.price', 250000)
                ->where('availability.0.status', 'available'));
    }

    public function test_cash_walk_in_booking_is_created_confirmed_and_paid(): void
    {
        $this->actingAs($this->admin)
            ->post(route('admin.bookings.store'), $this->payload())
            ->assertRedirect();

        $booking = Booking::query()->firstOrFail();

        $this->assertSame(BookingSource::WalkIn, $booking->source);
        $this->assertSame(BookingStatus::Confirmed, $booking->status);
        $this->assertSame(PaymentStatus::Paid, $booking->payment_status);
        $this->assertSame(CustomerType::Guest, $booking->customer_type);
        $this->assertSame(500000, $booking->total);
        $this->assertSame(0, $booking->remaining_amount);
        $this->assertSame('08:00:00', $booking->start_time);
        $this->assertSame('10:00:00', $booking->end_time);
        $this->assertSame('6281200000001', $booking->customer_phone);
        $this->assertSame($this->admin->id, $booking->created_by);
        $this->assertCount(2, $booking->items);
        $this->assertSame(PaymentProvider::Cash, $booking->payments()->first()->provider);
    }

    public function test_price_is_recalculated_on_the_server(): void
    {
        $this->actingAs($this->admin)
            ->post(route('admin.bookings.store'), $this->payload(['total' => 1, 'subtotal' => 1]))
            ->assertRedirect();

        $this->assertSame(500000, Booking::query()->firstOrFail()->total);
    }

    public function test_booked_slot_cannot_be_sold_again(): void
    {
        $this->actingAs($this->admin)->post(route('admin.bookings.store'), $this->payload());

        $this->actingAs($this->admin)
            ->post(route('admin.bookings.store'), $this->payload(['slots' => ['09:00:00']]))
            ->assertSessionHasErrors('slots');

        $this->assertSame(1, Booking::query()->count());
    }

    public function test_slots_must_be_contiguous(): void
    {
        $this->actingAs($this->admin)
            ->post(route('admin.bookings.store'), $this->payload(['slots' => ['08:00:00', '11:00:00']]))
            ->assertSessionHasErrors('slots');
    }

    public function test_walk_in_is_linked_to_existing_member_account(): void
    {
        $member = User::factory()->create(['phone' => '6281200000001']);

        $this->actingAs($this->admin)->post(route('admin.bookings.store'), $this->payload());

        $booking = Booking::query()->firstOrFail();

        $this->assertSame($member->id, $booking->user_id);
        $this->assertSame(CustomerType::Member, $booking->customer_type);
    }

    public function test_qris_walk_in_charges_midtrans_and_shows_the_qr(): void
    {
        Http::fake([
            'api.sandbox.midtrans.com/v2/charge' => Http::response([
                'status_code' => '201',
                'transaction_id' => 'trx-1',
                'order_id' => 'ignored',
                'gross_amount' => '500000.00',
                'transaction_status' => 'pending',
                'payment_type' => 'qris',
                'expiry_time' => now(Booking::TIMEZONE)->addMinutes(15)->format('Y-m-d H:i:s'),
                'actions' => [['name' => 'generate-qr-code', 'url' => 'https://api.sandbox.midtrans.com/v2/qris/trx-1/qr-code']],
            ]),
            'api.sandbox.midtrans.com/v2/*/status' => Http::response(['transaction_status' => 'pending', 'status_code' => '201']),
        ]);

        $this->actingAs($this->admin)
            ->post(route('admin.bookings.store'), $this->payload(['payment_method' => 'qris']))
            ->assertRedirect();

        $booking = Booking::query()->firstOrFail();

        $this->actingAs($this->admin)
            ->get(route('admin.bookings.payment', $booking))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Bookings/Payment')
                ->where('payment.qr_url', 'https://api.sandbox.midtrans.com/v2/qris/trx-1/qr-code')
                ->where('payment.amount', 500000)
                ->where('booking.payment_status', PaymentStatus::Unpaid->value));

        $this->assertSame(TransactionStatus::Pending, Payment::query()->firstOrFail()->status);
        $this->assertSame(BookingStatus::Pending, $booking->refresh()->status);
    }

    public function test_offline_payment_can_be_recorded_on_an_unpaid_booking(): void
    {
        $this->actingAs($this->admin)->post(route('admin.bookings.store'), $this->payload(['payment_method' => 'unpaid']));

        $booking = Booking::query()->firstOrFail();
        $this->assertSame(PaymentStatus::Unpaid, $booking->payment_status);

        $this->actingAs($this->admin)
            ->post(route('admin.bookings.payment.store', $booking), ['amount' => 500000, 'provider' => 'venue_qris'])
            ->assertRedirect(route('admin.bookings.show', $booking));

        $booking->refresh();

        $this->assertSame(PaymentStatus::Paid, $booking->payment_status);
        $this->assertSame(BookingStatus::Confirmed, $booking->status);
    }

    public function test_offline_payment_cannot_exceed_the_remaining_amount(): void
    {
        $this->actingAs($this->admin)->post(route('admin.bookings.store'), $this->payload(['payment_method' => 'unpaid']));
        $booking = Booking::query()->firstOrFail();

        $this->actingAs($this->admin)
            ->post(route('admin.bookings.payment.store', $booking), ['amount' => 600000, 'provider' => 'cash'])
            ->assertSessionHasErrors('amount');
    }

    public function test_owner_can_create_walk_in_bookings_but_customer_cannot(): void
    {
        $owner = User::factory()->owner()->create();

        $this->actingAs($owner)->get(route('admin.bookings.create'))->assertOk();
        $this->actingAs($owner)->post(route('admin.bookings.store'), $this->payload())->assertRedirect();
        $this->assertSame(1, Booking::query()->count());

        $this->actingAs(User::factory()->create())->get(route('admin.bookings.create'))->assertForbidden();
    }

    public function test_ongoing_slot_can_still_be_sold_at_the_venue(): void
    {
        $this->travelTo(CarbonImmutable::parse($this->date.' 08:30:00', Booking::TIMEZONE));

        $this->actingAs($this->admin)
            ->get(route('admin.bookings.create', ['court_id' => $this->court->id, 'date' => $this->date]))
            ->assertInertia(fn (Assert $page) => $page->where('availability.2.status', 'ongoing'));

        $this->actingAs($this->admin)
            ->post(route('admin.bookings.store'), $this->payload(['slots' => ['08:00:00']]))
            ->assertRedirect();

        $this->assertSame(1, Booking::query()->count());
    }
}
