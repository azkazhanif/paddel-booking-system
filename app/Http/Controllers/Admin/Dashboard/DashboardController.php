<?php

namespace App\Http\Controllers\Admin\Dashboard;

use App\Enums\BookingStatus;
use App\Enums\CustomerType;
use App\Enums\PaymentOption;
use App\Enums\RefundStatus;
use App\Enums\TransactionStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingItem;
use App\Models\Court;
use App\Models\OperatingHour;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Booking yang dihitung sebagai "terjadi" (slot terpakai). Pending & expired diabaikan.
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
            'period' => ['nullable', 'in:today,7d,30d,month,custom'],
            'from' => ['nullable', 'required_if:period,custom', 'date'],
            'to' => ['nullable', 'required_if:period,custom', 'date', 'after_or_equal:from', 'before_or_equal:'.now(Booking::TIMEZONE)->addYear()->toDateString()],
        ]);

        $period = $filters['period'] ?? '30d';
        $today = CarbonImmutable::now(Booking::TIMEZONE)->startOfDay();

        [$from, $to] = match ($period) {
            'today' => [$today, $today],
            '7d' => [$today->subDays(6), $today],
            'month' => [$today->startOfMonth(), $today],
            'custom' => [CarbonImmutable::parse($filters['from'], Booking::TIMEZONE), CarbonImmutable::parse($filters['to'], Booking::TIMEZONE)],
            default => [$today->subDays(29), $today],
        };

        // Rentang custom dibatasi 1 tahun agar agregasi di PHP tetap ringan
        $to = $to->min($from->addDays(365));

        $length = (int) $from->diffInDays($to) + 1;
        $isOwner = $request->user()->isOwner();

        $current = $this->summary($from, $to);
        $previous = $this->summary($from->subDays($length), $from->subDay());

        $kpis = [
            'bookings' => $this->compare($current['bookings'], $previous['bookings']),
            'occupancy' => $this->compare($current['occupancy'], $previous['occupancy']),
            'new_customers' => $this->compare($current['new_customers'], $previous['new_customers']),
            'cancellation_rate' => $this->compare($current['cancellation_rate'], $previous['cancellation_rate']),
            'receivables' => [
                'value' => (int) Booking::query()->unsettled()->active()->sum('remaining_amount'),
                'count' => Booking::query()->unsettled()->active()->count(),
            ],
            'composition' => $current['composition'],
        ];

        if ($isOwner) {
            $kpis['revenue'] = $this->compare($current['revenue'], $previous['revenue']);
            $kpis['average_value'] = $this->compare($current['average_value'], $previous['average_value']);
        }

        return Inertia::render('Admin/Dashboard', [
            'filters' => [
                'period' => $period,
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'kpis' => $kpis,
            'revenueTrend' => $isOwner ? $this->revenueTrend($from, $to) : null,
            'paymentMethods' => $isOwner ? $this->paymentMethods($from, $to) : null,
            'courtBookings' => $this->courtBookings($from, $to),
            'heatmap' => $this->heatmap($from, $to),
            'todayBookings' => Booking::query()
                ->with('court:id,name')
                ->whereDate('date', $today->toDateString())
                ->whereIn('status', [BookingStatus::Pending, BookingStatus::Confirmed, BookingStatus::CheckedIn, BookingStatus::Completed])
                ->orderBy('start_time')
                ->limit(8)
                ->get(['id', 'code', 'court_id', 'customer_name', 'customer_type', 'start_time', 'end_time', 'status', 'payment_status']),
            'pendingPayments' => Payment::query()
                ->with('booking:id,code,customer_name')
                ->where('status', TransactionStatus::Pending)
                ->latest()
                ->limit(5)
                ->get(['id', 'booking_id', 'type', 'amount', 'created_at', 'expires_at']),
            'topCustomers' => $this->topCustomers($from, $to, $isOwner),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function summary(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $bookings = Booking::query()
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->whereIn('status', [...self::COUNTED_STATUSES, BookingStatus::Cancelled])
            ->get(['id', 'status', 'customer_type', 'payment_option', 'total']);

        $counted = $bookings->whereIn('status', self::COUNTED_STATUSES);

        $revenue = (int) Payment::query()
            ->settled()
            ->whereBetween('paid_at', [$from->startOfDay()->utc(), $to->endOfDay()->utc()])
            ->sum('amount');

        $refunds = (int) Booking::query()
            ->where('refund_status', RefundStatus::Processed)
            ->whereBetween('cancelled_at', [$from->startOfDay()->utc(), $to->endOfDay()->utc()])
            ->sum('refund_amount');

        $bookedSlots = BookingItem::query()
            ->where('is_active', true)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->whereHas('booking', fn ($query) => $query->whereIn('status', self::COUNTED_STATUSES))
            ->count();

        $slotHours = (int) Setting::get('booking.slot_duration_minutes', 60) / 60;
        $availableHours = $this->availableHours($from, $to);

        return [
            'bookings' => $counted->count(),
            'revenue' => max(0, $revenue - $refunds),
            'average_value' => (int) round($counted->avg('total') ?? 0),
            'occupancy' => $availableHours > 0 ? round($bookedSlots * $slotHours / $availableHours * 100, 1) : 0,
            'cancellation_rate' => $bookings->isNotEmpty() ? round($bookings->where('status', BookingStatus::Cancelled)->count() / $bookings->count() * 100, 1) : 0,
            'new_customers' => User::query()
                ->customers()
                ->whereBetween('created_at', [$from->startOfDay()->utc(), $to->endOfDay()->utc()])
                ->count(),
            'composition' => [
                'guest' => $counted->where('customer_type', CustomerType::Guest)->count(),
                'member' => $counted->where('customer_type', CustomerType::Member)->count(),
                'full' => $counted->where('payment_option', PaymentOption::Full)->count(),
                'dp' => $counted->where('payment_option', PaymentOption::Dp)->count(),
            ],
        ];
    }

    /**
     * @return array{value: int|float, previous: int|float, change: float|null}
     */
    protected function compare(int|float $value, int|float $previous): array
    {
        return [
            'value' => $value,
            'previous' => $previous,
            'change' => $previous > 0 ? round(($value - $previous) / $previous * 100, 1) : null,
        ];
    }

    /**
     * Jam tersedia = jam buka per hari (kecuali tutup/libur) × jumlah lapangan aktif.
     */
    protected function availableHours(CarbonImmutable $from, CarbonImmutable $to): float
    {
        $courts = Court::query()->active()->count();
        $hours = OperatingHour::query()->get()->keyBy('day_of_week');
        $closures = Setting::get('booking.closures', []);
        $total = 0;

        foreach (CarbonPeriod::create($from, $to) as $day) {
            $open = $hours->get($day->isoWeekday());

            if (! $open || $open->is_closed || in_array($day->toDateString(), $closures, true)) {
                continue;
            }

            $total += (strtotime($open->close_time) - strtotime($open->open_time)) / 3600;
        }

        return $total * $courts;
    }

    /**
     * @return list<array{date: string, value: int}>
     */
    protected function revenueTrend(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $daily = Payment::query()
            ->settled()
            ->whereBetween('paid_at', [$from->startOfDay()->utc(), $to->endOfDay()->utc()])
            ->get(['amount', 'paid_at'])
            ->groupBy(fn (Payment $payment) => $payment->paid_at->timezone(Booking::TIMEZONE)->toDateString())
            ->map(fn (Collection $payments) => $payments->sum('amount'));

        return collect(CarbonPeriod::create($from, $to))
            ->map(fn ($day) => ['date' => $day->toDateString(), 'value' => (int) ($daily[$day->toDateString()] ?? 0)])
            ->all();
    }

    /**
     * @return list<array{label: string, value: int}>
     */
    protected function paymentMethods(CarbonImmutable $from, CarbonImmutable $to): array
    {
        return Payment::query()
            ->settled()
            ->whereBetween('paid_at', [$from->startOfDay()->utc(), $to->endOfDay()->utc()])
            ->get(['amount', 'payment_method', 'provider'])
            ->groupBy(fn (Payment $payment) => $payment->payment_method ?: $payment->provider->value)
            ->map(fn (Collection $payments, string $method) => ['label' => $method, 'value' => (int) $payments->sum('amount')])
            ->sortByDesc('value')
            ->values()
            ->all();
    }

    /**
     * @return list<array{label: string, value: int}>
     */
    protected function courtBookings(CarbonImmutable $from, CarbonImmutable $to): array
    {
        return Court::query()
            ->orderBy('sort_order')
            ->withCount(['bookings' => fn ($query) => $query
                ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
                ->whereIn('status', self::COUNTED_STATUSES)])
            ->get(['id', 'name'])
            ->map(fn (Court $court) => ['label' => $court->name, 'value' => $court->bookings_count])
            ->all();
    }

    /**
     * Okupansi per hari (Senin–Minggu) × jam: slot terpakai ÷ (jumlah hari tsb dalam rentang × lapangan aktif).
     *
     * @return array{hours: list<int>, rows: list<array{day: int, values: list<float>}>}
     */
    protected function heatmap(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $operating = OperatingHour::query()->where('is_closed', false)->get();

        if ($operating->isEmpty()) {
            return ['hours' => [], 'rows' => []];
        }

        $close = CarbonImmutable::parse($operating->max('close_time'));
        $hours = range((int) substr($operating->min('open_time'), 0, 2), $close->minute > 0 ? $close->hour : $close->hour - 1);
        $courts = max(1, Court::query()->active()->count());

        $occurrences = collect(CarbonPeriod::create($from, $to))->countBy(fn ($day) => $day->isoWeekday());

        $counts = BookingItem::query()
            ->where('is_active', true)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->whereHas('booking', fn ($query) => $query->whereIn('status', self::COUNTED_STATUSES))
            ->get(['date', 'start_time'])
            ->countBy(fn (BookingItem $item) => $item->date->isoWeekday().'-'.(int) substr($item->start_time, 0, 2));

        return [
            'hours' => $hours,
            'rows' => collect(range(1, 7))->map(fn (int $day) => [
                'day' => $day,
                'values' => array_map(
                    fn (int $hour) => ($occurrences[$day] ?? 0) > 0
                        ? round(($counts["{$day}-{$hour}"] ?? 0) / ($occurrences[$day] * $courts) * 100)
                        : 0,
                    $hours,
                ),
            ])->all(),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function topCustomers(CarbonImmutable $from, CarbonImmutable $to, bool $withAmount): array
    {
        return Booking::query()
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->whereIn('status', self::COUNTED_STATUSES)
            ->selectRaw('customer_email, MAX(customer_name) as name, MAX(user_id) as user_id, COUNT(*) as bookings, SUM(paid_amount) as spent')
            ->groupBy('customer_email')
            ->orderByDesc($withAmount ? 'spent' : 'bookings')
            ->limit(5)
            ->toBase()
            ->get()
            ->map(fn (object $row) => [
                'email' => $row->customer_email,
                'name' => $row->name,
                'user_id' => $row->user_id,
                'bookings' => (int) $row->bookings,
                'spent' => $withAmount ? (int) $row->spent : null,
            ])
            ->all();
    }
}
