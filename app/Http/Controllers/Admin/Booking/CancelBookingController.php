<?php

namespace App\Http\Controllers\Admin\Booking;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CancelBookingController extends Controller
{
    public function __invoke(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $cancelled = DB::transaction(function () use ($request, $booking, $validated) {
            $booking = Booking::query()->lockForUpdate()->findOrFail($booking->id);

            if (! $booking->isCancellableByStaff()) {
                return false;
            }

            // Slot dilepas agar bisa dibooking lagi, link bayar yang masih pending
            // dimatikan, dan refund ditandai bila sudah ada uang masuk.
            $booking->cancel($request->user()->id, $validated['reason']);

            return true;
        });

        if ($cancelled) {
            ActivityLog::record('booking.cancelled', $booking, ['reason' => $validated['reason']]);
        }

        return $cancelled
            ? back()->with('success', "Booking {$booking->code} dibatalkan. Proses refund (bila ada) dilakukan terpisah.")
            : back()->with('error', 'Booking ini sudah tidak bisa dibatalkan.');
    }
}
