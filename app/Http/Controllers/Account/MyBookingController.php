<?php

namespace App\Http\Controllers\Account;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Booking\BookingController;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Payment\PaymentController;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

/**
 * Riwayat booking member: tab akan datang / selesai / dibatalkan, beserta tombol
 * lanjutkan pembayaran, lunasi DP, dan batalkan booking.
 */
class MyBookingController extends Controller
{
    protected const TABS = ['upcoming', 'past', 'cancelled'];

    public function index(Request $request)
    {
        $validated = $request->validate([
            'tab' => ['nullable', 'in:'.implode(',', self::TABS)],
        ]);

        $user = $request->user();

        // BR-G7: booking tamu dengan email yang sama ikut tertarik ke akun ini.
        Booking::claimFor($user);
        Booking::expireStale();

        $tab = $validated['tab'] ?? 'upcoming';

        return Inertia::render('MyBookings/Index', [
            'tab' => $tab,
            'counts' => fn () => collect(self::TABS)
                ->mapWithKeys(fn (string $name) => [$name => $this->scoped($user->bookings(), $name)->count()])
                ->all(),
            'bookings' => fn () => $this->scoped($user->bookings(), $tab)
                ->with('court:id,name,type')
                ->orderBy('date', $tab === 'upcoming' ? 'asc' : 'desc')
                ->orderBy('start_time', $tab === 'upcoming' ? 'asc' : 'desc')
                ->get()
                ->map(fn (Booking $booking) => [
                    ...$booking->only([
                        'code', 'date', 'start_time', 'end_time', 'total', 'paid_amount', 'remaining_amount',
                        'status', 'payment_status', 'payment_option', 'settlement_due_at', 'expires_at',
                    ]),
                    'court' => $booking->court?->only(['id', 'name', 'type']),
                    'can_pay' => $booking->status === BookingStatus::Pending && ! $booking->hasExpired(),
                    'can_settle' => $booking->payment_status === PaymentStatus::DpPaid && $booking->isPayable(),
                    'can_cancel' => $booking->canBeCancelled(),
                ]),
        ]);
    }

    public function show(Request $request, Booking $booking)
    {
        Gate::authorize('view', $booking);

        $booking->loadMissing(['court:id,name,type', 'items', 'payments', 'invoice']);

        return Inertia::render('MyBookings/Show', [
            'booking' => BookingController::bookingPayload($booking) + [
                'can_pay' => $booking->status === BookingStatus::Pending && ! $booking->hasExpired(),
                'can_settle' => $booking->payment_status === PaymentStatus::DpPaid && $booking->isPayable(),
                'can_cancel' => $booking->canBeCancelled(),
                'cancel_before_hours' => (int) Setting::get('booking.cancel_before_hours', 24),
                'cancel_reason' => $booking->cancel_reason,
                'checked_in_at' => $booking->checked_in_at,
            ],
            'payments' => $booking->payments
                ->sortByDesc('created_at')
                ->map(fn (Payment $payment) => [
                    ...$payment->only(['order_id', 'type', 'amount', 'status', 'payment_method', 'paid_at']),
                ])
                ->values(),
            'invoice' => PaymentController::invoicePayload($booking),
            'venue' => [
                'name' => Setting::get('venue.name', 'PBS Padel Club'),
                'address' => Setting::get('venue.address', ''),
                'whatsapp' => Setting::get('venue.whatsapp', ''),
                'coordinates' => Setting::get('venue.coordinates', ['lat' => null, 'lng' => null]),
            ],
            'snap' => [
                'enabled' => Payment::midtransConfigured() && filled(config('midtrans.client_key')),
                'clientKey' => config('midtrans.client_key'),
                'isProduction' => (bool) config('midtrans.is_production'),
            ],
        ]);
    }

    /**
     * @param  Builder<Booking>|HasMany<Booking, User>  $query
     * @return Builder<Booking>|HasMany<Booking, User>
     */
    protected function scoped($query, string $tab)
    {
        return match ($tab) {
            'past' => $query->clone()
                ->where(fn (Builder $query) => $query
                    ->whereIn('status', [BookingStatus::Completed, BookingStatus::CheckedIn])
                    ->orWhere(fn (Builder $query) => $query->active()->past())),
            'cancelled' => $query->clone()
                ->whereIn('status', [BookingStatus::Cancelled, BookingStatus::Expired, BookingStatus::NoShow]),
            default => $query->clone()->active()->upcoming(),
        };
    }
}
