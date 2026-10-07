<?php

namespace Tests\Feature\Booking;

use App\Enums\PaymentProvider;
use App\Enums\PaymentType;
use App\Enums\VoucherType;
use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use App\Models\Voucher;
use Database\Seeders\OperatingHourSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class VoucherTest extends TestCase
{
    use RefreshDatabase;

    protected Court $court;

    protected string $date;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(OperatingHourSeeder::class);
        $this->seed(SettingSeeder::class);

        Mail::fake();

        $this->court = Court::factory()->create(['base_price' => 250000]);
        $this->date = now(Booking::TIMEZONE)->addDay()->toDateString();
    }

    protected function voucher(array $overrides = []): Voucher
    {
        return Voucher::create([
            'code' => 'PBS20',
            'type' => VoucherType::Percent,
            'value' => 20,
            'min_amount' => 0,
            'members_only' => false,
            'is_active' => true,
            ...$overrides,
        ]);
    }

    protected function guestBooking(): Booking
    {
        $this->post(route('booking.store'), [
            'court_id' => $this->court->id,
            'date' => $this->date,
            'slots' => ['08:00:00', '09:00:00'],
            'customer_name' => 'Andre',
            'customer_email' => 'andre@example.com',
            'customer_email_confirmation' => 'andre@example.com',
            'customer_phone' => '081200000001',
            'players_count' => 4,
            'terms' => true,
        ])->assertRedirect();

        return Booking::query()->latest('id')->firstOrFail();
    }

    public function test_percentage_voucher_reduces_the_total(): void
    {
        $this->voucher();
        $booking = $this->guestBooking();

        $this->post(route('booking.voucher.store', $booking->code), ['code' => 'pbs20'])->assertSessionHasNoErrors();

        $booking->refresh();

        $this->assertSame(100000, $booking->discount);
        $this->assertSame(400000, $booking->total);
        $this->assertSame(400000, $booking->remaining_amount);
        // Invoice ikut menyesuaikan.
        $this->assertSame(400000, $booking->invoice->refresh()->total);
    }

    public function test_fixed_voucher_and_maximum_discount_are_respected(): void
    {
        $this->voucher(['code' => 'POTONG50', 'type' => VoucherType::Fixed, 'value' => 50000]);
        $booking = $this->guestBooking();

        $this->post(route('booking.voucher.store', $booking->code), ['code' => 'POTONG50']);
        $this->assertSame(450000, $booking->refresh()->total);

        $this->voucher(['code' => 'HEMAT', 'value' => 50, 'max_discount' => 75000]);
        $this->post(route('booking.voucher.store', $booking->code), ['code' => 'HEMAT']);

        // 50% dari 500.000 = 250.000, dibatasi maks. 75.000.
        $this->assertSame(75000, $booking->refresh()->discount);
        $this->assertSame(425000, $booking->total);
    }

    public function test_voucher_can_be_removed(): void
    {
        $this->voucher();
        $booking = $this->guestBooking();

        $this->post(route('booking.voucher.store', $booking->code), ['code' => 'PBS20']);
        $this->delete(route('booking.voucher.destroy', $booking->code))->assertSessionHasNoErrors();

        $booking->refresh();

        $this->assertNull($booking->voucher_id);
        $this->assertSame(0, $booking->discount);
        $this->assertSame(500000, $booking->total);
    }

    public function test_unknown_expired_and_quota_exhausted_vouchers_are_rejected(): void
    {
        $booking = $this->guestBooking();

        $this->post(route('booking.voucher.store', $booking->code), ['code' => 'TIDAKADA'])->assertSessionHasErrors('code');

        $this->voucher(['code' => 'LEWAT', 'ends_at' => now()->subDay()]);
        $this->post(route('booking.voucher.store', $booking->code), ['code' => 'LEWAT'])->assertSessionHasErrors('code');

        $this->voucher(['code' => 'HABIS', 'quota' => 2, 'used_count' => 2]);
        $this->post(route('booking.voucher.store', $booking->code), ['code' => 'HABIS'])->assertSessionHasErrors('code');

        $this->voucher(['code' => 'MAHAL', 'min_amount' => 1000000]);
        $this->post(route('booking.voucher.store', $booking->code), ['code' => 'MAHAL'])->assertSessionHasErrors('code');

        $this->assertSame(500000, $booking->refresh()->total);
    }

    public function test_members_only_voucher_is_rejected_for_guests(): void
    {
        $this->voucher(['code' => 'MEMBER', 'members_only' => true]);
        $booking = $this->guestBooking();

        $this->post(route('booking.voucher.store', $booking->code), ['code' => 'MEMBER'])->assertSessionHasErrors('code');
    }

    public function test_quota_is_consumed_on_confirmation_and_returned_on_cancellation(): void
    {
        $voucher = $this->voucher(['quota' => 5]);
        $booking = $this->guestBooking();

        $this->post(route('booking.voucher.store', $booking->code), ['code' => 'PBS20']);
        $this->assertSame(0, $voucher->refresh()->used_count);

        $booking->refresh()->recordOfflinePayment(400000, PaymentProvider::Cash, PaymentType::Full, User::factory()->admin()->create()->id);
        $this->assertSame(1, $voucher->refresh()->used_count);

        $booking->refresh()->cancel(null, 'Dibatalkan admin');
        $this->assertSame(0, $voucher->refresh()->used_count);
    }

    public function test_voucher_cannot_be_changed_after_payment_started(): void
    {
        $this->voucher();
        $booking = $this->guestBooking();
        $booking->recordOfflinePayment(500000, PaymentProvider::Cash, PaymentType::Full, User::factory()->admin()->create()->id);

        $this->post(route('booking.voucher.store', $booking->code), ['code' => 'PBS20'])->assertSessionHasErrors('code');
    }

    public function test_checkout_shows_the_applied_voucher(): void
    {
        $this->voucher();
        $booking = $this->guestBooking();

        $this->post(route('booking.voucher.store', $booking->code), ['code' => 'PBS20']);

        $this->get(route('booking.checkout', $booking->code))
            ->assertInertia(fn (Assert $page) => $page
                ->where('booking.voucher.code', 'PBS20')
                ->where('booking.voucher.label', 'Diskon 20%')
                ->where('booking.discount', 100000)
                ->where('booking.total', 400000));
    }

    public function test_admin_can_manage_vouchers(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->post(route('admin.vouchers.store'), [
                'code' => 'promo10',
                'type' => 'percent',
                'value' => 10,
                'max_discount' => 50000,
                'min_amount' => 100000,
                'quota' => 100,
                'members_only' => true,
                'starts_at' => null,
                'ends_at' => null,
                'is_active' => true,
            ])
            ->assertRedirect(route('admin.vouchers.index'));

        $voucher = Voucher::query()->firstOrFail();
        $this->assertSame('PROMO10', $voucher->code);

        $this->actingAs($admin)->patch(route('admin.vouchers.toggle', $voucher))->assertSessionHasNoErrors();
        $this->assertFalse($voucher->refresh()->is_active);

        $this->actingAs($admin)
            ->get(route('admin.vouchers.index'))
            ->assertInertia(fn (Assert $page) => $page->component('Admin/Vouchers/Index')->has('vouchers.data', 1));

        $this->actingAs($admin)->delete(route('admin.vouchers.destroy', $voucher));
        $this->assertSoftDeleted($voucher);
    }

    public function test_percentage_value_cannot_exceed_a_hundred(): void
    {
        $this->actingAs(User::factory()->admin()->create())
            ->post(route('admin.vouchers.store'), [
                'code' => 'SALAH',
                'type' => 'percent',
                'value' => 150,
                'min_amount' => 0,
                'members_only' => false,
                'is_active' => true,
            ])
            ->assertSessionHasErrors('value');
    }

    public function test_customers_cannot_manage_vouchers(): void
    {
        $this->actingAs(User::factory()->create())->get(route('admin.vouchers.index'))->assertForbidden();
    }
}
