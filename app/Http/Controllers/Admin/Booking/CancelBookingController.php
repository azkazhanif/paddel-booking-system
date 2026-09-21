<?php

namespace App\Http\Controllers\Admin\Booking;

use App\Enums\BookingStatus;
use App\Enums\TransactionStatus;
use App\Http\Controllers\Controller;
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

            $booking->update([
                'status' => BookingStatus::Cancelled,
                'cancelled_at' => now(),
                'cancelled_by' => $request->user()->id,
                'cancel_reason' => $validated['reason'],
            ]);

            // Slot dilepas agar bisa dibooking lagi; link bayar yang masih pending tidak lagi berlaku
            $booking->releaseSlots();
            $booking->payments()->where('status', TransactionStatus::Pending)->update(['status' => TransactionStatus::Failed]);

            return true;
        });

        return $cancelled
            ? back()->with('success', "Booking {$booking->code} dibatalkan. Proses refund (bila ada) dilakukan terpisah.")
            : back()->with('error', 'Booking ini sudah tidak bisa dibatalkan.');
    }
}
