<?php

namespace App\Http\Controllers\Admin\Receivable;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Sisa tagihan: booking aktif yang belum lunas, diurutkan dari yang paling dekat
 * jam mainnya supaya staff tahu mana yang harus ditagih lebih dulu.
 */
class ReceivableController extends Controller
{
    public function index(Request $request)
    {
        Booking::expireStale();

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'court_id' => ['nullable', 'integer'],
            'scope' => ['nullable', 'in:upcoming,overdue,past,all'],
        ]);

        $scope = $filters['scope'] ?? 'upcoming';

        $query = Booking::query()
            ->with('court:id,name')
            ->whereIn('status', [BookingStatus::Confirmed, BookingStatus::CheckedIn])
            ->where('remaining_amount', '>', 0)
            ->when($filters['search'] ?? null, fn (Builder $query, string $search) => $query->where(fn (Builder $query) => $query
                ->where('code', 'like', "%{$search}%")
                ->orWhere('customer_name', 'like', "%{$search}%")
                ->orWhere('customer_email', 'like', "%{$search}%")
                ->orWhere('customer_phone', 'like', '%'.(User::normalizePhone($search) ?? $search).'%')))
            ->when($filters['court_id'] ?? null, fn (Builder $query, int $courtId) => $query->where('court_id', $courtId));

        $query = match ($scope) {
            'overdue' => $query->whereNotNull('settlement_due_at')->where('settlement_due_at', '<', now()),
            'past' => $query->past(),
            'all' => $query,
            default => $query->upcoming(),
        };

        $receivables = (clone $query)
            ->orderBy('date')
            ->orderBy('start_time')
            ->paginate(20, [
                'id', 'code', 'court_id', 'customer_name', 'customer_email', 'customer_phone', 'date', 'start_time', 'end_time',
                'total', 'paid_amount', 'remaining_amount', 'payment_option', 'payment_status', 'settlement_due_at', 'status',
            ])
            ->withQueryString();

        return Inertia::render('Admin/Receivables/Index', [
            'receivables' => $receivables,
            'filters' => [...$filters, 'scope' => $scope],
            'courts' => Court::query()->orderBy('sort_order')->get(['id', 'name']),
            'summary' => [
                'total' => (int) (clone $query)->sum('remaining_amount'),
                'count' => (clone $query)->count(),
                'overdue' => Booking::query()
                    ->whereIn('status', [BookingStatus::Confirmed, BookingStatus::CheckedIn])
                    ->where('remaining_amount', '>', 0)
                    ->where('payment_status', PaymentStatus::DpPaid)
                    ->whereNotNull('settlement_due_at')
                    ->where('settlement_due_at', '<', now())
                    ->count(),
            ],
        ]);
    }
}
