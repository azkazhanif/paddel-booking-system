<?php

namespace Tests\Feature\Admin;

use App\Enums\BookingStatus;
use App\Enums\PaymentType;
use App\Enums\TransactionStatus;
use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use Database\Seeders\OperatingHourSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_kpis_are_calculated_from_settled_payments_and_counted_bookings(): void
    {
        $this->seed(OperatingHourSeeder::class);
        $court = Court::factory()->create();
        $today = now(Booking::TIMEZONE)->toDateString();

        $paid = Booking::factory()->for($court)->create(['date' => $today, 'start_time' => '19:00:00', 'end_time' => '20:00:00']);
        $paid->payments()->create(['type' => PaymentType::Full, 'order_id' => 'ORD-1', 'amount' => 300000, 'status' => TransactionStatus::Settlement, 'paid_at' => now()]);
        $paid->payments()->create(['type' => PaymentType::Full, 'order_id' => 'ORD-2', 'amount' => 999000, 'status' => TransactionStatus::Pending]);

        Booking::factory()->for($court)->status(BookingStatus::Cancelled)->create(['date' => $today, 'start_time' => '08:00:00', 'end_time' => '09:00:00']);
        Booking::factory()->for($court)->status(BookingStatus::Expired)->create(['date' => $today, 'start_time' => '09:00:00', 'end_time' => '10:00:00']);
        Booking::factory()->for($court)->dpPaid()->create(['date' => now(Booking::TIMEZONE)->addDays(3)->toDateString()]);

        $this->actingAs(User::factory()->owner()->create())
            ->get(route('admin.dashboard', ['period' => 'today']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('kpis.revenue.value', 300000)
                ->where('kpis.bookings.value', 1)
                ->where('kpis.cancellation_rate.value', 50)
                ->where('kpis.receivables.value', 210000)
                ->where('kpis.receivables.count', 1)
                // 1 jam terpesan dari 17 jam buka × 1 lapangan
                ->where('kpis.occupancy.value', 5.9)
                ->has('todayBookings', 1)
                ->has('pendingPayments', 1)
                ->has('heatmap.rows', 7));
    }

    public function test_custom_period_requires_valid_dates(): void
    {
        $this->actingAs(User::factory()->owner()->create())
            ->get(route('admin.dashboard', ['period' => 'custom', 'from' => '2026-09-10', 'to' => '2026-09-01']))
            ->assertSessionHasErrors('to');
    }
}
