<?php

namespace App\Http\Controllers\Admin\User;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

/**
 * Kelola akun internal (staff, admin, owner). Hanya untuk owner.
 */
class UserController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', Rule::in(UserRole::internalValues())],
        ]);

        return Inertia::render('Admin/Users/Index', [
            'users' => User::query()
                ->internal()
                ->when($filters['search'] ?? null, fn ($query, string $search) => $query->where(fn ($query) => $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")))
                ->when($filters['role'] ?? null, fn ($query, string $role) => $query->where('role', $role))
                ->orderByRaw('CASE role WHEN ? THEN 0 WHEN ? THEN 1 ELSE 2 END', [UserRole::Owner->value, UserRole::Admin->value])
                ->orderBy('name')
                ->paginate(15, ['id', 'name', 'email', 'phone', 'role', 'is_blocked', 'created_at'])
                ->withQueryString(),
            'filters' => $filters,
            'roles' => $this->roleOptions(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Users/Form', [
            'user' => null,
            'roles' => $this->roleOptions(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['required', Rule::in(UserRole::internalValues())],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        User::create([...$validated, 'phone' => User::normalizePhone($validated['phone'] ?? null)])
            ->forceFill(['email_verified_at' => now()])
            ->save();

        return redirect()->route('admin.users.index')->with('success', 'Akun ditambahkan.');
    }

    public function edit(User $user)
    {
        abort_unless($user->hasRole(...UserRole::internalValues()), 404);

        return Inertia::render('Admin/Users/Form', [
            'user' => $user->only(['id', 'name', 'email', 'phone', 'role', 'is_blocked']),
            'roles' => $this->roleOptions(),
        ]);
    }

    public function update(Request $request, User $user)
    {
        abort_unless($user->hasRole(...UserRole::internalValues()), 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['required', Rule::in(UserRole::internalValues())],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ]);

        if ($user->is($request->user()) && $validated['role'] !== $user->role->value) {
            return back()->with('error', 'Kamu tidak bisa mengubah role akunmu sendiri.');
        }

        if ($this->isLastActiveOwner($user) && $validated['role'] !== UserRole::Owner->value) {
            return back()->with('error', 'Minimal harus ada satu owner aktif.');
        }

        $user->update([
            ...collect($validated)->except('password')->all(),
            'phone' => User::normalizePhone($validated['phone'] ?? null),
            ...(! empty($validated['password']) ? ['password' => $validated['password']] : []),
        ]);

        return redirect()->route('admin.users.index')->with('success', 'Akun diperbarui.');
    }

    public function toggle(Request $request, User $user)
    {
        abort_unless($user->hasRole(...UserRole::internalValues()), 404);

        if ($user->is($request->user())) {
            return back()->with('error', 'Kamu tidak bisa menonaktifkan akunmu sendiri.');
        }

        if (! $user->is_blocked && $this->isLastActiveOwner($user)) {
            return back()->with('error', 'Minimal harus ada satu owner aktif.');
        }

        $user->update(['is_blocked' => ! $user->is_blocked]);

        return back()->with('success', $user->is_blocked ? "Akun {$user->name} dinonaktifkan." : "Akun {$user->name} diaktifkan.");
    }

    protected function isLastActiveOwner(User $user): bool
    {
        return $user->isOwner()
            && ! $user->is_blocked
            && User::query()->where('role', UserRole::Owner)->where('is_blocked', false)->count() === 1;
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    protected function roleOptions(): array
    {
        return array_map(fn (string $role) => ['value' => $role, 'label' => UserRole::from($role)->label()], UserRole::internalValues());
    }
}
