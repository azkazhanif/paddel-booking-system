<?php

namespace Tests\Feature\Admin;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Court;
use App\Models\SlotBlock;
use App\Models\User;
use Database\Seeders\OperatingHourSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ScheduleTest extends TestCase
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
        $this->court = Court::factory()->create();
        $this->date = now(Booking::TIMEZONE)->addDays(2)->toDateString();
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
            'start_time' => '08:00',
            'end_time' => '10:00',
            'reason' => 'maintenance',
            'note' => 'Ganti lampu',
            ...$overrides,
        ];
    }

    public function test_schedule_page_shows_slots_and_who_booked_them(): void
    {
        Booking::factory()->create([
            'court_id' => $this->court->id,
            'date' => $this->date,
            'start_time' => '08:00:00',
            'end_time' => '09:00:00',
            'customer_name' => 'Rina',
        ]);

        $this->actingAs($this->admin)
            ->get(route('admin.schedule.index', ['court_id' => $this->court->id, 'date' => $this->date]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Schedule/Index')
                ->where('selected.date', $this->date)
                ->where('slots.2.status', 'booked')
                ->where('slots.2.booking.customer_name', 'Rina')
                ->where('slots.3.status', 'available'));
    }

    public function test_admin_can_block_and_unblock_slots(): void
    {
        $this->actingAs($this->admin)
            ->post(route('admin.schedule.blocks.store'), $this->payload())
            ->assertSessionHasNoErrors();

        $block = SlotBlock::query()->firstOrFail();

        $this->assertSame($this->admin->id, $block->created_by);
        $this->assertSame('08:00:00', $block->start_time);
        $this->assertSame('10:00:00', $block->end_time);

        // Slot yang diblokir tidak lagi tersedia di halaman booking publik.
        $this->get(route('booking.create', ['court_id' => $this->court->id, 'date' => $this->date]))
            ->assertInertia(fn (Assert $page) => $page->where('availability.2.status', 'blocked'));

        $this->actingAs($this->admin)
            ->delete(route('admin.schedule.blocks.destroy', $block))
            ->assertSessionHasNoErrors();

        $this->assertSame(0, SlotBlock::query()->count());
    }

    public function test_blocked_slot_cannot_be_booked_by_a_guest(): void
    {
        $this->actingAs($this->admin)->post(route('admin.schedule.blocks.store'), $this->payload());

        $this->post(route('booking.store'), [
            'court_id' => $this->court->id,
            'date' => $this->date,
            'slots' => ['08:00:00'],
            'customer_name' => 'Andre',
            'customer_email' => 'andre@example.com',
            'customer_email_confirmation' => 'andre@example.com',
            'customer_phone' => '081200000001',
            'players_count' => 4,
            'terms' => true,
        ])->assertSessionHasErrors('slots');

        $this->assertSame(0, Booking::query()->count());
    }

    public function test_slot_with_an_active_booking_cannot_be_blocked(): void
    {
        Booking::factory()->create([
            'court_id' => $this->court->id,
            'date' => $this->date,
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'status' => BookingStatus::Confirmed,
        ]);

        $this->actingAs($this->admin)
            ->post(route('admin.schedule.blocks.store'), $this->payload())
            ->assertSessionHasErrors('start_time');

        $this->assertSame(0, SlotBlock::query()->count());
    }

    public function test_cancelled_booking_frees_the_slot_for_blocking(): void
    {
        Booking::factory()->create([
            'court_id' => $this->court->id,
            'date' => $this->date,
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'status' => BookingStatus::Cancelled,
        ]);

        $this->actingAs($this->admin)
            ->post(route('admin.schedule.blocks.store'), $this->payload())
            ->assertSessionHasNoErrors();

        $this->assertSame(1, SlotBlock::query()->count());
    }

    public function test_customers_cannot_reach_the_schedule_page(): void
    {
        $this->actingAs(User::factory()->create())->get(route('admin.schedule.index'))->assertForbidden();
    }
}
