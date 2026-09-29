<?php

namespace App\Http\Controllers\Admin\Booking;

use App\Enums\BookingSource;
use App\Enums\BookingStatus;
use App\Enums\CustomerType;
use App\Enums\PaymentStatus;
use App\Enums\TransactionStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'court_id' => ['nullable', 'integer'],
            'status' => ['nullable', Rule::enum(BookingStatus::class)],
            'payment_status' => ['nullable', Rule::enum(PaymentStatus::class)],
            'customer_type' => ['nullable', Rule::enum(CustomerType::class)],
            'source' => ['nullable', Rule::enum(BookingSource::class)],
        ]);

        $bookings = Booking::query()
            ->with('court:id,name')
            ->when($filters['search'] ?? null, fn (Builder $query, string $search) => $query->where(fn (Builder $query) => $query
                ->where('code', 'like', "%{$search}%")
                ->orWhere('customer_name', 'like', "%{$search}%")
                ->orWhere('customer_email', 'like', "%{$search}%")
                ->orWhere('customer_phone', 'like', '%'.(User::normalizePhone($search) ?? $search).'%')))
            ->when($filters['date_from'] ?? null, fn (Builder $query, string $date) => $query->whereDate('date', '>=', $date))
            ->when($filters['date_to'] ?? null, fn (Builder $query, string $date) => $query->whereDate('date', '<=', $date))
            ->when($filters['court_id'] ?? null, fn (Builder $query, int $courtId) => $query->where('court_id', $courtId))
            ->when($filters['status'] ?? null, fn (Builder $query, string $status) => $query->where('status', $status))
            ->when($filters['payment_status'] ?? null, fn (Builder $query, string $status) => $query->where('payment_status', $status))
            ->when($filters['customer_type'] ?? null, fn (Builder $query, string $type) => $query->where('customer_type', $type))
            ->when($filters['source'] ?? null, fn (Builder $query, string $source) => $query->where('source', $source))
            ->orderByDesc('date')
            ->orderByDesc('start_time')
            ->paginate(15, [
                'id', 'code', 'court_id', 'customer_type', 'customer_name', 'customer_email', 'date', 'start_time', 'end_time',
                'total', 'paid_amount', 'remaining_amount', 'status', 'payment_status', 'source',
            ])
            ->withQueryString();

        return Inertia::render('Admin/Bookings/Index', [
            'bookings' => $bookings,
            'filters' => $filters,
            'courts' => Court::query()->orderBy('sort_order')->get(['id', 'name']),
        ]);
    }

    public function show(Booking $booking)
    {
        $booking->load([
            'court:id,name,type',
            'user:id,name,email,phone',
            'items',
            'payments' => fn ($query) => $query->with('recordedBy:id,name')->latest(),
            'invoice:id,booking_id,number,status',
            'checkedInBy:id,name',
            'cancelledBy:id,name',
            'createdBy:id,name',
        ]);

        return Inertia::render('Admin/Bookings/Show', [
            'booking' => $booking,
            'can' => [
                'cancel' => $booking->isCancellableByStaff(),
                'checkIn' => $booking->checkInBlocker() === null,
                'recordPayment' => $booking->remaining_amount > 0 && $booking->isCancellableByStaff(),
                'chargeQris' => $booking->remaining_amount > 0 && $booking->isCancellableByStaff() && Payment::midtransConfigured(),
            ],
            'checkInBlocker' => $booking->checkInBlocker(),
            'hasPendingPayment' => $booking->payments->contains('status', TransactionStatus::Pending),
        ]);
    }
}
