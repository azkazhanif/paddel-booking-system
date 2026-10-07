<?php

namespace App\Http\Controllers\Admin\Report;

use App\Enums\BookingStatus;
use App\Enums\CustomerType;
use App\Enums\PaymentOption;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Payment;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Laporan pendapatan & pemakaian lapangan untuk owner. Angka pendapatan dihitung
 * dari pembayaran yang benar-benar settle, bukan dari nilai booking.
 */
class ReportController extends Controller
{
    protected const COUNTED_STATUSES = [
        BookingStatus::Confirmed,
        BookingStatus::CheckedIn,
        BookingStatus::Completed,
        BookingStatus::NoShow,
    ];

    public function index(Request $request)
    {
        [$from, $to, $period] = $this->range($request);

        return Inertia::render('Admin/Reports/Index', [
            'filters' => ['period' => $period, 'from' => $from->toDateString(), 'to' => $to->toDateString()],
            'summary' => $this->summary($from, $to),
            'revenueTrend' => $this->revenueTrend($from, $to),
            'courts' => $this->perCourt($from, $to),
            'paymentMethods' => $this->paymentMethods($from, $to),
            'composition' => $this->composition($from, $to),
            'exportUrl' => route('admin.reports.export', ['period' => $period, 'from' => $from->toDateString(), 'to' => $to->toDateString()]),
        ]);
    }

    /**
     * Unduhan CSV berisi satu baris per booking pada periode terpilih.
     */
    public function export(Request $request): StreamedResponse
    {
        [$from, $to] = $this->range($request);

        $bookings = Booking::query()
            ->with('court:id,name')
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->whereIn('status', self::COUNTED_STATUSES)
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        $filename = "laporan-pbs-{$from->toDateString()}-{$to->toDateString()}.csv";

        return response()->streamDownload(function () use ($bookings) {
            $handle = fopen('php://output', 'wb');

            fputcsv($handle, ['Kode', 'Tanggal', 'Mulai', 'Selesai', 'Lapangan', 'Pemesan', 'Tipe', 'Opsi bayar', 'Total', 'Dibayar', 'Sisa', 'Status']);

            foreach ($bookings as $booking) {
                fputcsv($handle, [
                    $booking->code,
                    $booking->date->toDateString(),
                    substr($booking->start_time, 0, 5),
                    substr($booking->end_time, 0, 5),
                    $booking->court?->name,
                    $booking->customer_name,
                    $booking->customer_type->value,
                    $booking->payment_option->value,
                    $booking->total,
                    $booking->paid_amount,
                    $booking->remaining_amount,
                    $booking->status->value,
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * @return array{0: CarbonImmutable, 1: CarbonImmutable, 2: string}
     */
    protected function range(Request $request): array
    {
        $filters = $request->validate([
            'period' => ['nullable', 'in:7d,30d,90d,month,year,custom'],
            'from' => ['nullable', 'required_if:period,custom', 'date'],
            'to' => ['nullable', 'required_if:period,custom', 'date', 'after_or_equal:from'],
        ]);

        $period = $filters['period'] ?? '30d';
        $today = CarbonImmutable::now(Booking::TIMEZONE)->startOfDay();

        [$from, $to] = match ($period) {
            '7d' => [$today->subDays(6), $today],
            '90d' => [$today->subDays(89), $today],
            'month' => [$today->startOfMonth(), $today],
            'year' => [$today->startOfYear(), $today],
            'custom' => [
                CarbonImmutable::parse($filters['from'], Booking::TIMEZONE),
                CarbonImmutable::parse($filters['to'], Booking::TIMEZONE),
            ],
            default => [$today->subDays(29), $today],
        };

        return [$from, $to->min($from->addDays(365)), $period];
    }

    /**
     * @return array<string, mixed>
     */
    protected function summary(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $bookings = Booking::query()
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->whereIn('status', self::COUNTED_STATUSES)
            ->get(['id', 'total', 'paid_amount', 'remaining_amount', 'status', 'customer_type', 'payment_option']);

        $revenue = (int) Payment::query()
            ->settled()
            ->whereBetween('paid_at', [$from->startOfDay(), $to->endOfDay()])
            ->sum('amount');

        return [
            'revenue' => $revenue,
            'bookings' => $bookings->count(),
            'booked_value' => (int) $bookings->sum('total'),
            'outstanding' => (int) $bookings->sum('remaining_amount'),
            'average_value' => $bookings->count() ? (int) round($bookings->sum('total') / $bookings->count()) : 0,
            'no_show' => $bookings->where('status', BookingStatus::NoShow)->count(),
            'days' => (int) $from->diffInDays($to) + 1,
        ];
    }

    /**
     * @return list<array{date: string, value: int}>
     */
    protected function revenueTrend(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $byDate = Payment::query()
            ->settled()
            ->whereBetween('paid_at', [$from->startOfDay(), $to->endOfDay()])
            ->get(['amount', 'paid_at'])
            ->groupBy(fn (Payment $payment) => $payment->paid_at->timezone(Booking::TIMEZONE)->toDateString())
            ->map(fn (Collection $payments) => (int) $payments->sum('amount'));

        return collect(CarbonPeriod::create($from, $to))
            ->map(fn (CarbonInterface $date) => [
                'date' => $date->toDateString(),
                'value' => $byDate[$date->toDateString()] ?? 0,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function perCourt(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $bookings = Booking::query()
            ->with('court:id,name')
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->whereIn('status', self::COUNTED_STATUSES)
            ->withCount('items')
            ->get(['id', 'court_id', 'total', 'paid_amount']);

        return Court::query()
            ->orderBy('sort_order')
            ->get(['id', 'name'])
            ->map(function (Court $court) use ($bookings) {
                $rows = $bookings->where('court_id', $court->id);

                return [
                    'name' => $court->name,
                    'bookings' => $rows->count(),
                    'hours' => (int) $rows->sum('items_count'),
                    'value' => (int) $rows->sum('total'),
                    'paid' => (int) $rows->sum('paid_amount'),
                ];
            })
            ->sortByDesc('value')
            ->values()
            ->all();
    }

    /**
     * @return list<array{label: string, value: int, count: int}>
     */
    protected function paymentMethods(CarbonImmutable $from, CarbonImmutable $to): array
    {
        return Payment::query()
            ->settled()
            ->whereBetween('paid_at', [$from->startOfDay(), $to->endOfDay()])
            ->get(['amount', 'payment_method', 'provider'])
            ->groupBy(fn (Payment $payment) => $payment->payment_method ?: $payment->provider->value)
            ->map(fn (Collection $payments, string $label) => [
                'label' => $label,
                'value' => (int) $payments->sum('amount'),
                'count' => $payments->count(),
            ])
            ->sortByDesc('value')
            ->values()
            ->all();
    }

    /**
     * @return array<string, int>
     */
    protected function composition(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $bookings = Booking::query()
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->whereIn('status', self::COUNTED_STATUSES)
            ->get(['customer_type', 'payment_option']);

        return [
            'guest' => $bookings->where('customer_type', CustomerType::Guest)->count(),
            'member' => $bookings->where('customer_type', CustomerType::Member)->count(),
            'full' => $bookings->where('payment_option', PaymentOption::Full)->count(),
            'dp' => $bookings->where('payment_option', PaymentOption::Dp)->count(),
        ];
    }
}
