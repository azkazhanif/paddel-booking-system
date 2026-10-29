<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Halaman profil: data akun, ganti password, dan hapus akun.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Profile/Edit', [
            'status' => session('status'),
            'profile' => [
                ...$user->only(['name', 'email', 'phone']),
                'avatar' => $user->avatar_path ? Storage::disk('public')->url($user->avatar_path) : null,
                'can_use_dp' => $user->canUseDp(),
                'member_since' => $user->created_at,
            ],
            'stats' => fn () => [
                'bookings' => $user->bookings()->count(),
                'upcoming' => $user->bookings()->active()->upcoming()->count(),
                'unsettled' => $user->bookings()->unsettled()->active()->count(),
                'spent' => (int) $user->bookings()->sum('paid_amount'),
            ],
        ]);
    }

    /**
     * Update data akun. Mengganti email mencabut status verifikasi (BR-DP1).
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $user->fill(collect($validated)->except(['avatar', 'remove_avatar'])->all());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        if ($request->file('avatar') || $request->boolean('remove_avatar')) {
            if ($user->avatar_path) {
                Storage::disk('public')->delete($user->avatar_path);
            }

            $user->avatar_path = $request->file('avatar')
                ? $request->file('avatar')->store('avatars', 'public')
                : null;
        }

        $user->save();

        return redirect()->route('profile.edit')->with('success', 'Profil diperbarui.');
    }

    /**
     * Hapus akun. Booking yang sudah ada tetap tersimpan sebagai riwayat venue
     * (user_id dilepas oleh foreign key nullOnDelete).
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        if ($user->bookings()->active()->upcoming()->exists()) {
            return back()->with('error', 'Masih ada booking yang akan datang. Batalkan dulu sebelum menghapus akun.');
        }

        Auth::logout();

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }
}
