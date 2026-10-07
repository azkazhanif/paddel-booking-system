<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Check-in di venue. Staff memindai QR e-ticket (link ber-signature) lalu
 * mengonfirmasi kedatangan; booking yang belum lunas ditolak sampai dilunasi.
 */
class CheckInController extends Controller
{
    public function show(Booking $booking)
    {
        $booking->loadMissing('court:id,name');

        return Inertia::render('Staff/Scan', [
            'venue' => Setting::venue(),
            'booking' => [
                ...$booking->only([
                    'code', 'customer_name', 'customer_phone', 'players_count', 'notes', 'date',
                    'start_time', 'end_time', 'total', 'paid_amount', 'remaining_amount',
                    'status', 'payment_status', 'checked_in_at',
                ]),
                'court' => $booking->court?->only(['id', 'name']),
                'check_in_blocker' => $booking->checkInBlocker(),
            ],
        ]);
    }

    public function store(Request $request, Booking $booking)
    {
        $error = DB::transaction(function () use ($request, $booking) {
            $locked = Booking::query()->lockForUpdate()->findOrFail($booking->id);

            return $locked->checkIn($request->user()->id);
        });

        return $error
            ? back()->with('error', $error)
            : back()->with('success', "Booking {$booking->code} check-in. Selamat bermain!");
    }
}
