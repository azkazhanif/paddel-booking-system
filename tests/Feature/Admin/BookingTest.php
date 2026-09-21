<?php

namespace Tests\Feature\Admin;

use App\Enums\BookingStatus;
use App\Enums\PaymentType;
use App\Enums\TransactionStatus;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BookingTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
    }

    public function test_index_can_be_filtered_and_searched(): void
    {
        Booking::factory()->create(['customer_name' => 'Rina Maharani']);
        Booking::factory()->status(BookingStatus::Cancelled)->create(['customer_name' => 'Andre Wijaya']);

        $this->actingAs($this->admin)
            ->get(route('admin.bookings.index', ['search' => 'rina']))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Bookings/Index')
                ->has('bookings.data', 1)
                ->where('bookings.data.0.customer_name', 'Rina Maharani'));

        $this->actingAs($this->admin)
            ->get(route('admin.bookings.index', ['status' => 'cancelled']))
            ->assertInertia(fn (Assert $page) => $page->has('bookings.data', 1)->where('bookings.data.0.customer_name', 'Andre Wijaya'));
    }

    public function test_show_renders_booking_detail(): void
    {
        $booking = Booking::factory()->create();

        $this->actingAs($this->admin)
            ->get(route('admin.bookings.show', $booking))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Bookings/Show')
                ->where('booking.code', $booking->code)
                ->has('booking.items', 1)
                ->where('can.cancel', true)
                ->where('can.checkIn', false));
    }

    public function test_cancel_requires_reason_and_releases_slots(): void
    {
        $booking = Booking::factory()->create();
        $booking->payments()->create(['type' => PaymentType::Full, 'order_id' => 'ORD-1', 'amount' => 300000, 'status' => TransactionStatus::Pending]);

        $this->actingAs($this->admin)->post(route('admin.bookings.cancel', $booking))->assertSessionHasErrors('reason');

        $this->actingAs($this->admin)
            ->post(route('admin.bookings.cancel', $booking), ['reason' => 'Lapangan maintenance'])
            ->assertSessionHas('success');

        $booking->refresh();
        $this->assertSame(BookingStatus::Cancelled, $booking->status);
        $this->assertSame($this->admin->id, $booking->cancelled_by);
        $this->assertSame('Lapangan maintenance', $booking->cancel_reason);
        $this->assertNull($booking->items()->value('is_active'));
        $this->assertSame(TransactionStatus::Failed, $booking->payments()->sole()->status);
    }

    public function test_completed_booking_cannot_be_cancelled(): void
    {
        $booking = Booking::factory()->status(BookingStatus::Completed)->create();

        $this->actingAs($this->admin)
            ->post(route('admin.bookings.cancel', $booking), ['reason' => 'Salah input'])
            ->assertSessionHas('error');

        $this->assertSame(BookingStatus::Completed, $booking->refresh()->status);
    }

    public function test_paid_booking_today_can_check_in(): void
    {
        $booking = Booking::factory()->today()->create();

        $this->actingAs($this->admin)
            ->post(route('admin.bookings.check-in', $booking))
            ->assertSessionHas('success');

        $booking->refresh();
        $this->assertSame(BookingStatus::CheckedIn, $booking->status);
        $this->assertSame($this->admin->id, $booking->checked_in_by);
        $this->assertNotNull($booking->checked_in_at);
    }

    public function test_check_in_is_rejected_for_unsettled_or_other_day_bookings(): void
    {
        $unsettled = Booking::factory()->today()->dpPaid()->create();
        $tomorrow = Booking::factory()->create(['date' => now(Booking::TIMEZONE)->addDay()->toDateString()]);

        $this->actingAs($this->admin)->post(route('admin.bookings.check-in', $unsettled))->assertSessionHas('error');
        $this->actingAs($this->admin)->post(route('admin.bookings.check-in', $tomorrow))->assertSessionHas('error');

        $this->assertSame(BookingStatus::Confirmed, $unsettled->refresh()->status);
        $this->assertSame(BookingStatus::Confirmed, $tomorrow->refresh()->status);
    }
}
