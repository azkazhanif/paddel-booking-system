<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/**
 * Pembatalan booking oleh member sendiri (BR-09). Slot langsung dilepas, dan
 * bila sudah ada uang masuk refund ditandai untuk ditindaklanjuti admin.
 */
class CancelBookingController extends Controller
{
    public function __invoke(Request $request, Booking $booking)
    {
        Gate::authorize('view', $booking);

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        if (! $booking->canBeCancelled()) {
            return back()->with('error', 'Booking ini sudah tidak bisa dibatalkan sendiri. Hubungi venue untuk bantuan.');
        }

        DB::transaction(function () use ($booking, $request, $validated) {
            $locked = Booking::query()->lockForUpdate()->findOrFail($booking->id);

            $locked->cancel($request->user()->id, $validated['reason'] ?? null);
        });

        return redirect()->route('my-bookings.show', $booking->code)->with('success', 'Booking dibatalkan.');
    }
}
