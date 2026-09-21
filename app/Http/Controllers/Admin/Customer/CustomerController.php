<?php

namespace App\Http\Controllers\Admin\Customer;

use App\Enums\BookingStatus;
use App\Enums\CustomerType;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    /**
     * Status booking yang dihitung ke total booking & transaksi customer.
     */
    protected const COUNTED_STATUSES = [
        BookingStatus::Confirmed,
        BookingStatus::CheckedIn,
        BookingStatus::Completed,
        BookingStatus::NoShow,
    ];

    public function index(Request $request)
    {
        $filters = $request->validate([
            'tab' => ['nullable', 'in:member,guest'],
            'search' => ['nullable', 'string', 'max:100'],
            'segment' => ['nullable', 'in:new,loyal,inactive'],
            'sort' => ['nullable', 'in:latest,spent,last_booking,bookings'],
        ]);

        $filters['tab'] ??= 'member';
        $filters['sort'] ??= 'latest';

        return Inertia::render('Admin/Customers/Index', [
            'filters' => $filters,
            'customers' => $filters['tab'] === 'guest' ? $this->guests($filters) : $this->members($filters),
            'counts' => [
                'member' => User::query()->customers()->count(),
                'guest' => Booking::query()->where('customer_type', CustomerType::Guest)->distinct()->count('customer_email'),
            ],
        ]);
    }

    public function show(User $user)
    {
        abort_unless($user->role === UserRole::Customer, 404);

        $bookings = $user->bookings()
            ->with('court:id,name')
            ->orderByDesc('date')
            ->orderByDesc('start_time')
            ->get(['id', 'user_id', 'code', 'court_id', 'date', 'start_time', 'end_time', 'total', 'paid_amount', 'remaining_amount', 'status', 'payment_status', 'payment_option']);

        $counted = $bookings->whereIn('status', self::COUNTED_STATUSES);

        return Inertia::render('Admin/Customers/Show', [
            'customer' => [
                ...$user->only(['id', 'name', 'email', 'phone', 'is_blocked', 'blocked_reason', 'admin_notes', 'created_at', 'email_verified_at', 'dp_suspended_until']),
                'can_use_dp' => $user->canUseDp(),
            ],
            'stats' => [
                'bookings' => $counted->count(),
                'spent' => (int) $counted->sum('paid_amount'),
                'outstanding' => (int) $bookings->whereIn('status', [BookingStatus::Confirmed])->sum('remaining_amount'),
                'cancelled' => $bookings->where('status', BookingStatus::Cancelled)->count(),
                'no_show' => $bookings->where('status', BookingStatus::NoShow)->count(),
                'last_booking' => $counted->max(fn (Booking $booking) => $booking->date->toDateString()),
            ],
            'bookings' => $bookings,
            'payments' => $user->payments()
                ->with('booking:id,code')
                ->latest('payments.created_at')
                ->limit(20)
                ->get(['payments.id', 'payments.booking_id', 'payments.type', 'payments.provider', 'payments.payment_method', 'payments.amount', 'payments.status', 'payments.paid_at', 'payments.created_at']),
        ]);
    }

    public function update(Request $request, User $user)
    {
        abort_unless($user->role === UserRole::Customer, 404);

        $validated = $request->validate([
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $user->update($validated);

        return back()->with('success', 'Catatan customer disimpan.');
    }

    public function block(Request $request, User $user)
    {
        abort_unless($user->role === UserRole::Customer, 404);

        $validated = $request->validate([
            'is_blocked' => ['required', 'boolean'],
            'blocked_reason' => ['nullable', 'required_if_accepted:is_blocked', 'string', 'max:255'],
        ]);

        $user->update([
            'is_blocked' => $validated['is_blocked'],
            'blocked_reason' => $validated['is_blocked'] ? $validated['blocked_reason'] : null,
        ]);

        return back()->with('success', $user->is_blocked ? "{$user->name} diblokir." : "Blokir {$user->name} dibuka.");
    }

    /**
     * @param  array<string, string>  $filters
     */
    protected function members(array $filters)
    {
        $counted = fn (Builder $query) => $query->whereIn('status', self::COUNTED_STATUSES);

        return User::query()
            ->customers()
            ->withCount(['bookings' => $counted])
            ->withSum(['bookings as spent' => $counted], 'paid_amount')
            ->withMax(['bookings as last_booking' => $counted], 'date')
            ->when($filters['search'] ?? null, fn (Builder $query, string $search) => $query->where(fn (Builder $query) => $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('phone', 'like', '%'.(User::normalizePhone($search) ?? $search).'%')))
            ->when($filters['segment'] ?? null, fn (Builder $query, string $segment) => match ($segment) {
                'new' => $query->where('created_at', '>=', now()->subDays(30)),
                'loyal' => $query->whereHas('bookings', $counted, '>=', 5),
                'inactive' => $query->whereDoesntHave('bookings', fn (Builder $query) => $counted($query)->whereDate('date', '>=', now(Booking::TIMEZONE)->subDays(60)->toDateString())),
            })
            ->when($filters['sort'], fn (Builder $query, string $sort) => match ($sort) {
                'spent' => $query->orderByDesc('spent'),
                'last_booking' => $query->orderByDesc('last_booking'),
                'bookings' => $query->orderByDesc('bookings_count'),
                default => $query->latest(),
            })
            ->paginate(15, ['id', 'name', 'email', 'phone', 'is_blocked', 'created_at'])
            ->withQueryString();
    }

    /**
     * Guest dikelompokkan berdasarkan email unik.
     *
     * @param  array<string, string>  $filters
     */
    protected function guests(array $filters)
    {
        $counted = 'status IN ('.implode(', ', array_fill(0, count(self::COUNTED_STATUSES), '?')).')';
        $statuses = array_map(fn (BookingStatus $status) => $status->value, self::COUNTED_STATUSES);

        return Booking::query()
            ->toBase()
            ->where('customer_type', CustomerType::Guest->value)
            ->selectRaw('customer_email as email, MAX(customer_name) as name, MAX(customer_phone) as phone, MIN(created_at) as created_at, MAX(date) as last_booking')
            ->selectRaw("SUM(CASE WHEN {$counted} THEN 1 ELSE 0 END) as bookings_count", $statuses)
            ->selectRaw("SUM(CASE WHEN {$counted} THEN paid_amount ELSE 0 END) as spent", $statuses)
            ->when($filters['search'] ?? null, fn ($query, string $search) => $query->where(fn ($query) => $query
                ->where('customer_name', 'like', "%{$search}%")
                ->orWhere('customer_email', 'like', "%{$search}%")
                ->orWhere('customer_phone', 'like', '%'.(User::normalizePhone($search) ?? $search).'%')))
            ->groupBy('customer_email')
            ->when($filters['segment'] ?? null, fn ($query, string $segment) => match ($segment) {
                'new' => $query->havingRaw('MIN(created_at) >= ?', [now()->subDays(30)->toDateTimeString()]),
                'loyal' => $query->havingRaw("SUM(CASE WHEN {$counted} THEN 1 ELSE 0 END) >= 5", $statuses),
                'inactive' => $query->havingRaw('MAX(date) < ?', [now(Booking::TIMEZONE)->subDays(60)->toDateString()]),
            })
            ->when($filters['sort'], fn ($query, string $sort) => match ($sort) {
                'spent' => $query->orderByDesc('spent'),
                'last_booking' => $query->orderByDesc('last_booking'),
                'bookings' => $query->orderByDesc('bookings_count'),
                default => $query->orderByDesc('created_at'),
            })
            ->paginate(15)
            ->withQueryString();
    }
}
