<?php

namespace App\Http\Controllers\Booking;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Policies\BookingPolicy;
use Illuminate\Http\Request;

/**
 * Akses booking tamu lewat link signed (dari email / tombol "simpan link" di checkout).
 * Kode booking dicatat ke sesi, lalu diarahkan ke checkout atau halaman status.
 */
class GuestBookingController extends Controller
{
    public function __invoke(Request $request, Booking $booking)
    {
        BookingPolicy::grantSessionAccess($booking);

        Booking::expireStale();
        $booking->refresh();

        return $booking->status === BookingStatus::Pending && $booking->paid_amount === 0 && ! $booking->hasExpired()
            ? redirect()->route('booking.checkout', $booking->code)
            : redirect()->route('booking.status', $booking->code);
    }
}
