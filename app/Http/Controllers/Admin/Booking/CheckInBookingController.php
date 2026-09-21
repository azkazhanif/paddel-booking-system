<?php

namespace App\Http\Controllers\Admin\Booking;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheckInBookingController extends Controller
{
    public function __invoke(Request $request, Booking $booking)
    {
        $error = DB::transaction(function () use ($request, $booking) {
            $booking = Booking::query()->lockForUpdate()->findOrFail($booking->id);

            if ($blocker = $booking->checkInBlocker()) {
                return $blocker;
            }

            $booking->update([
                'status' => BookingStatus::CheckedIn,
                'checked_in_at' => now(),
                'checked_in_by' => $request->user()->id,
            ]);

            return null;
        });

        return $error
            ? back()->with('error', $error)
            : back()->with('success', "Booking {$booking->code} berhasil check-in.");
    }
}
