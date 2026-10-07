<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
    }

    public function test_customer_and_staff_cannot_access_admin_panel(): void
    {
        $this->actingAs(User::factory()->create())->get(route('admin.dashboard'))->assertForbidden();
        $this->actingAs(User::factory()->staff()->create())->get(route('admin.bookings.index'))->assertForbidden();
    }

    public function test_owner_and_admin_can_access_admin_panel(): void
    {
        foreach ([User::factory()->owner()->create(), User::factory()->admin()->create()] as $user) {
            $this->actingAs($user)->get(route('admin.dashboard'))->assertOk();
            $this->actingAs($user)->get(route('admin.courts.index'))->assertOk();
            $this->actingAs($user)->get(route('admin.bookings.index'))->assertOk();
            $this->actingAs($user)->get(route('admin.customers.index'))->assertOk();
        }
    }

    public function test_deactivated_admin_is_forbidden(): void
    {
        $this->actingAs(User::factory()->admin()->blocked()->create())
            ->get(route('admin.dashboard'))
            ->assertForbidden();
    }

    public function test_only_owner_can_manage_users(): void
    {
        $this->actingAs(User::factory()->admin()->create())->get(route('admin.users.index'))->assertForbidden();
        $this->actingAs(User::factory()->owner()->create())->get(route('admin.users.index'))->assertOk();
    }

    public function test_dashboard_redirects_by_role_after_login(): void
    {
        $this->actingAs(User::factory()->owner()->create())->get(route('dashboard'))->assertRedirect(route('admin.dashboard'));
        $this->actingAs(User::factory()->admin()->create())->get(route('dashboard'))->assertRedirect(route('admin.dashboard'));
        $this->actingAs(User::factory()->create())->get(route('dashboard'))->assertRedirect(route('my-bookings.index'));
    }

    public function test_dashboard_hides_finance_data_from_admin(): void
    {
        $this->actingAs(User::factory()->admin()->create())
            ->get(route('admin.dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Dashboard')
                ->missing('kpis.revenue')
                ->missing('kpis.average_value')
                ->where('revenueTrend', null)
                ->where('paymentMethods', null)
                ->where('auth.can.viewFinance', false));

        $this->actingAs(User::factory()->owner()->create())
            ->get(route('admin.dashboard', ['period' => '7d']))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Dashboard')
                ->has('kpis.revenue')
                ->has('revenueTrend', 7)
                ->where('filters.period', '7d')
                ->where('auth.can.viewFinance', true));
    }

    public function test_user_seeder_creates_owner_admin_and_staff_accounts(): void
    {
        $this->seed(UserSeeder::class);
        $this->seed(UserSeeder::class);

        $this->assertSame(UserRole::Owner, User::query()->where('email', 'owner@pbs.test')->sole()->role);
        $this->assertSame(UserRole::Admin, User::query()->where('email', 'admin@pbs.test')->sole()->role);
        $this->assertSame(UserRole::Staff, User::query()->where('email', 'staff@pbs.test')->sole()->role);
        $this->assertNotNull(User::query()->where('email', 'owner@pbs.test')->value('email_verified_at'));
    }
}
