<?php

namespace App\Http\Controllers\Admin\Booking;

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

            return $booking->checkIn($request->user()->id);
        });

        return $error
            ? back()->with('error', $error)
            : back()->with('success', "Booking {$booking->code} berhasil check-in.");
    }
}
