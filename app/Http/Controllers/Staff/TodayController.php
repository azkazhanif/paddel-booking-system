<?php

namespace App\Http\Controllers\Staff;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Setting;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Layar operasional staff: daftar booking hari ini beserta status pembayaran,
 * lengkap dengan tombol check-in untuk tamu yang datang tanpa menunjukkan QR.
 */
class TodayController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
            'court_id' => ['nullable', 'integer'],
        ]);

        Booking::expireStale();

        $date = CarbonImmutable::parse($filters['date'] ?? now(Booking::TIMEZONE)->toDateString(), Booking::TIMEZONE);
        $courtId = (int) ($filters['court_id'] ?? 0);

        $bookings = Booking::query()
            ->with('court:id,name')
            ->whereDate('date', $date->toDateString())
            ->whereIn('status', [BookingStatus::Confirmed, BookingStatus::CheckedIn, BookingStatus::Pending, BookingStatus::NoShow])
            ->when($courtId, fn ($query) => $query->where('court_id', $courtId))
            ->orderBy('start_time')
            ->get()
            ->map(fn (Booking $booking) => [
                ...$booking->only([
                    'code', 'customer_name', 'customer_phone', 'players_count', 'notes',
                    'start_time', 'end_time', 'total', 'paid_amount', 'remaining_amount',
                    'status', 'payment_status', 'checked_in_at',
                ]),
                'court' => $booking->court?->only(['id', 'name']),
                'check_in_blocker' => $booking->checkInBlocker(),
            ]);

        return Inertia::render('Staff/Today', [
            'venue' => Setting::venue(),
            'courts' => Court::query()->active()->orderBy('sort_order')->get(['id', 'name']),
            'selected' => ['date' => $date->toDateString(), 'court_id' => $courtId ?: null],
            'today' => now(Booking::TIMEZONE)->toDateString(),
            'bookings' => $bookings,
            'summary' => [
                'total' => $bookings->count(),
                'checked_in' => $bookings->where('status', BookingStatus::CheckedIn->value)->count(),
                'unsettled' => $bookings->where('remaining_amount', '>', 0)->count(),
            ],
        ]);
    }
}
