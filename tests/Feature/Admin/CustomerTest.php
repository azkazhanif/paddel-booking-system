<?php

namespace Tests\Feature\Admin;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CustomerTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
    }

    public function test_member_tab_lists_customers_with_totals(): void
    {
        $member = User::factory()->create(['name' => 'Rina']);
        Booking::factory()->forMember($member)->count(2)->create();
        Booking::factory()->forMember($member)->status(BookingStatus::Cancelled)->create();

        $this->actingAs($this->admin)
            ->get(route('admin.customers.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Customers/Index')
                ->has('customers.data', 1)
                ->where('customers.data.0.name', 'Rina')
                ->where('customers.data.0.bookings_count', 2)
                ->where('counts.member', 1));
    }

    public function test_guest_tab_groups_bookings_by_email(): void
    {
        Booking::factory()->count(2)->create(['customer_email' => 'yoga@example.com', 'customer_name' => 'Yoga']);
        Booking::factory()->create(['customer_email' => 'maya@example.com']);

        $this->actingAs($this->admin)
            ->get(route('admin.customers.index', ['tab' => 'guest', 'sort' => 'bookings']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('customers.data', 2)
                ->where('customers.data.0.email', 'yoga@example.com')
                ->where('customers.data.0.bookings_count', 2)
                ->where('counts.guest', 2));

        $this->actingAs($this->admin)
            ->get(route('admin.customers.index', ['tab' => 'guest', 'search' => 'maya']))
            ->assertInertia(fn (Assert $page) => $page->has('customers.data', 1));
    }

    public function test_show_is_only_for_customers(): void
    {
        $this->actingAs($this->admin)->get(route('admin.customers.show', User::factory()->create()))->assertOk();
        $this->actingAs($this->admin)->get(route('admin.customers.show', User::factory()->staff()->create()))->assertNotFound();
    }

    public function test_block_requires_reason_and_can_be_reverted(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($this->admin)->patch(route('admin.customers.block', $customer), ['is_blocked' => true])->assertSessionHasErrors('blocked_reason');

        $this->actingAs($this->admin)->patch(route('admin.customers.block', $customer), ['is_blocked' => true, 'blocked_reason' => '2x no-show']);
        $this->assertTrue($customer->refresh()->is_blocked);
        $this->assertFalse($customer->canUseDp());

        $this->actingAs($this->admin)->patch(route('admin.customers.block', $customer), ['is_blocked' => false]);
        $customer->refresh();
        $this->assertFalse($customer->is_blocked);
        $this->assertNull($customer->blocked_reason);
    }

    public function test_admin_notes_can_be_saved(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($this->admin)->patch(route('admin.customers.update', $customer), ['admin_notes' => 'Suka lapangan indoor'])->assertSessionHas('success');

        $this->assertSame('Suka lapangan indoor', $customer->refresh()->admin_notes);
    }
}
