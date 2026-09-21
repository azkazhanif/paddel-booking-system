<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->owner()->create();
    }

    public function test_index_lists_only_internal_accounts(): void
    {
        User::factory()->admin()->create();
        User::factory()->staff()->create();
        User::factory()->create();

        $this->actingAs($this->owner)
            ->get(route('admin.users.index'))
            ->assertInertia(fn (Assert $page) => $page->component('Admin/Users/Index')->has('users.data', 3)->where('users.data.0.role', 'owner'));
    }

    public function test_owner_can_create_verified_internal_account(): void
    {
        $this->actingAs($this->owner)
            ->post(route('admin.users.store'), [
                'name' => 'Dimas',
                'email' => 'dimas@pbs.test',
                'phone' => '0812 3456 7890',
                'role' => 'staff',
                'password' => 'rahasia-kuat-123',
                'password_confirmation' => 'rahasia-kuat-123',
            ])
            ->assertRedirect(route('admin.users.index'));

        $user = User::query()->where('email', 'dimas@pbs.test')->sole();
        $this->assertSame(UserRole::Staff, $user->role);
        $this->assertSame('6281234567890', $user->phone);
        $this->assertNotNull($user->email_verified_at);
    }

    public function test_customer_role_cannot_be_assigned(): void
    {
        $this->actingAs($this->owner)
            ->post(route('admin.users.store'), ['name' => 'X', 'email' => 'x@pbs.test', 'role' => 'customer', 'password' => 'rahasia-kuat-123', 'password_confirmation' => 'rahasia-kuat-123'])
            ->assertSessionHasErrors('role');
    }

    public function test_update_keeps_password_when_left_blank(): void
    {
        $admin = User::factory()->admin()->create();
        $hash = $admin->password;

        $this->actingAs($this->owner)
            ->put(route('admin.users.update', $admin), ['name' => 'Admin Baru', 'email' => $admin->email, 'role' => 'staff', 'password' => ''])
            ->assertRedirect(route('admin.users.index'));

        $admin->refresh();
        $this->assertSame('Admin Baru', $admin->name);
        $this->assertSame(UserRole::Staff, $admin->role);
        $this->assertSame($hash, $admin->password);

        $this->actingAs($this->owner)->put(route('admin.users.update', $admin), [
            'name' => 'Admin Baru', 'email' => $admin->email, 'role' => 'staff', 'password' => 'password-baru-123', 'password_confirmation' => 'password-baru-123',
        ]);
        $this->assertTrue(Hash::check('password-baru-123', $admin->refresh()->password));
    }

    public function test_owner_cannot_change_own_role_or_deactivate_self(): void
    {
        $this->actingAs($this->owner)
            ->put(route('admin.users.update', $this->owner), ['name' => $this->owner->name, 'email' => $this->owner->email, 'role' => 'admin'])
            ->assertSessionHas('error');

        $this->actingAs($this->owner)->patch(route('admin.users.toggle', $this->owner))->assertSessionHas('error');

        $this->owner->refresh();
        $this->assertSame(UserRole::Owner, $this->owner->role);
        $this->assertFalse($this->owner->is_blocked);
    }

    public function test_owner_can_deactivate_another_owner_and_is_locked_out(): void
    {
        $other = User::factory()->owner()->create();

        $this->actingAs($this->owner)->patch(route('admin.users.toggle', $other))->assertSessionHas('success');

        $this->assertTrue($other->refresh()->is_blocked);
        $this->actingAs($other)->get(route('admin.dashboard'))->assertForbidden();
    }

    public function test_toggle_deactivates_and_reactivates_account(): void
    {
        $staff = User::factory()->staff()->create();

        $this->actingAs($this->owner)->patch(route('admin.users.toggle', $staff))->assertSessionHas('success');
        $this->assertTrue($staff->refresh()->is_blocked);

        $this->actingAs($this->owner)->patch(route('admin.users.toggle', $staff));
        $this->assertFalse($staff->refresh()->is_blocked);
    }

    public function test_customer_accounts_are_not_editable_here(): void
    {
        $this->actingAs($this->owner)->get(route('admin.users.edit', User::factory()->create()))->assertNotFound();
    }
}
