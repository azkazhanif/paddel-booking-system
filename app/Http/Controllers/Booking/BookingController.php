<?php

namespace App\Http\Controllers\Booking;

use App\Enums\BookingSource;
use App\Enums\BookingStatus;
use App\Enums\CustomerType;
use App\Enums\PaymentOption;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\User;
use App\Policies\BookingPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Booking online untuk tamu maupun member: pilih tanggal, lapangan, dan jam,
 * isi data pemesan, lalu lanjut ke checkout. Slot ditahan selama masa hold (BR-05).
 */
class BookingController extends Controller
{
    public function create(Request $request)
    {
        // Booking pending yang lewat batas bayar dilepas dulu supaya slotnya tampil kosong.
        Booking::expireStale();

        $filters = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
            'court_id' => ['nullable', 'integer'],
        ]);

        $advanceDays = (int) Setting::get('booking.advance_days', 14);
        $today = now(Booking::TIMEZONE)->startOfDay();
        $date = CarbonImmutable::parse($filters['date'] ?? $today->toDateString(), Booking::TIMEZONE);
        $date = $date->lt($today) || $date->gt($today->addDays($advanceDays))
            ? CarbonImmutable::parse($today->toDateString(), Booking::TIMEZONE)
            : $date;

        $courts = Court::query()
            ->active()
            ->with(['coverImage', 'priceRules'])
            ->orderBy('sort_order')
            ->get()
            ->map(function (Court $court) use ($date) {
                $slots = collect($court->slotsOn($date));

                return [
                    'id' => $court->id,
                    'name' => $court->name,
                    'type' => $court->type->value,
                    'surface' => $court->surface,
                    'base_price' => $court->base_price,
                    'image' => $court->coverImage ? Storage::url($court->coverImage->path) : null,
                    'available' => $slots->where('status', 'available')->count(),
                    'total' => $slots->count(),
                ];
            })
            ->values();

        $court = Court::query()->active()->with('priceRules')->find((int) ($filters['court_id'] ?? 0))
            ?? Court::query()->active()->with('priceRules')->orderBy('sort_order')->first();

        // Tamu yang memilih "Masuk / Daftar" dikembalikan ke halaman ini setelah login.
        if (! $request->user()) {
            $request->session()->put('url.intended', route('booking.create', array_filter([
                'date' => $date->toDateString(),
                'court_id' => $court?->id,
            ])));
        }

        return Inertia::render('Booking/Create', [
            'courts' => $courts,
            'selected' => ['date' => $date->toDateString(), 'court_id' => $court?->id],
            'availability' => fn () => $court ? $court->availabilityOn($date) : [],
            'limits' => [
                'maxSlots' => (int) Setting::get('booking.max_slots_per_booking', 3),
                'advanceDays' => $advanceDays,
                'slotMinutes' => (int) Setting::get('booking.slot_duration_minutes', 60),
                'holdMinutes' => (int) Setting::get('booking.hold_minutes', 15),
            ],
            'serviceFee' => (int) Setting::get('booking.service_fee', 0),
            'today' => $today->toDateString(),
            'customer' => $request->user()?->only(['name', 'email', 'phone']),
            'guestEnabled' => (bool) Setting::get('guest.enabled', true),
            'dp' => [
                'enabled' => (bool) Setting::get('dp.enabled', true),
                'percentage' => (int) Setting::get('dp.percentage', 30),
                'minDaysAhead' => (int) Setting::get('dp.min_days_ahead', 1),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $maxSlots = (int) Setting::get('booking.max_slots_per_booking', 3);
        $advanceDays = (int) Setting::get('booking.advance_days', 14);

        $validated = $request->validate([
            'court_id' => ['required', Rule::exists('courts', 'id')->where('is_active', true)->whereNull('deleted_at')],
            'date' => [
                'required', 'date_format:Y-m-d',
                'after_or_equal:'.now(Booking::TIMEZONE)->toDateString(),
                'before_or_equal:'.now(Booking::TIMEZONE)->addDays($advanceDays)->toDateString(),
            ],
            'slots' => ['required', 'array', 'min:1', 'max:'.$maxSlots],
            'slots.*' => ['required', 'date_format:H:i:s', 'distinct'],
            'customer_name' => ['required', 'string', 'max:100'],
            'customer_phone' => ['required', 'string', 'max:20'],
            // Email tamu wajib & dikonfirmasi ulang: ke sana link bayar, invoice, dan e-ticket dikirim.
            'customer_email' => $user ? ['nullable', 'email', 'max:255'] : ['required', 'email', 'max:255', 'confirmed'],
            'players_count' => ['required', 'integer', 'min:1', 'max:12'],
            'notes' => ['nullable', 'string', 'max:500'],
            'terms' => ['accepted'],
        ]);

        $this->guardBookingLimits($request, $validated['customer_email'] ?? null);

        $date = CarbonImmutable::parse($validated['date'], Booking::TIMEZONE);
        $phone = User::normalizePhone($validated['customer_phone']);
        $holdMinutes = max(1, (int) Setting::get('booking.hold_minutes', 15));

        try {
            $booking = DB::transaction(function () use ($request, $user, $validated, $date, $phone, $holdMinutes) {
                $court = Court::query()->active()->with('priceRules')->lockForUpdate()->findOrFail($validated['court_id']);
                $slots = $this->resolveSlots($court, $date, $validated['slots']);

                $subtotal = array_sum(array_column($slots, 'price'));
                $serviceFee = (int) Setting::get('booking.service_fee', 0);

                $booking = Booking::create([
                    'code' => Booking::generateCode(),
                    'user_id' => $user?->id,
                    'court_id' => $court->id,
                    'customer_type' => $user ? CustomerType::Member : CustomerType::Guest,
                    'customer_name' => $validated['customer_name'],
                    // Identitas member diambil dari akun, bukan dari input yang bisa diubah client.
                    'customer_email' => $user?->email ?? $validated['customer_email'],
                    'customer_phone' => $phone,
                    'date' => $date->toDateString(),
                    'start_time' => $slots[0]['start_time'],
                    'end_time' => $slots[count($slots) - 1]['end_time'],
                    'players_count' => $validated['players_count'],
                    'notes' => $validated['notes'] ?? null,
                    'subtotal' => $subtotal,
                    'service_fee' => $serviceFee,
                    'total' => $subtotal + $serviceFee,
                    // Opsi DP dipilih di checkout (BR-G2: tamu tidak pernah dapat opsi ini).
                    'payment_option' => PaymentOption::Full,
                    'remaining_amount' => $subtotal + $serviceFee,
                    'status' => BookingStatus::Pending,
                    'source' => BookingSource::Online,
                    'expires_at' => now()->addMinutes($holdMinutes),
                    'ip_address' => $request->ip(),
                ]);

                foreach ($slots as $slot) {
                    $booking->items()->create([
                        'court_id' => $court->id,
                        'date' => $date->toDateString(),
                        'start_time' => $slot['start_time'],
                        'end_time' => $slot['end_time'],
                        'price' => $slot['price'],
                        'price_label' => $slot['price_label'],
                    ]);
                }

                return $booking;
            });
        } catch (QueryException $exception) {
            // Unique index booking_items (court_id, date, start_time, is_active): slot direbut
            // tepat saat submit, di luar jendela pengecekan ketersediaan.
            throw ValidationException::withMessages([
                'slots' => 'Jam yang dipilih baru saja dipesan orang lain. Muat ulang jadwal lalu pilih jam lain.',
            ]);
        }

        BookingPolicy::grantSessionAccess($booking);

        Invoice::issueFor($booking);
        $booking->sendPendingPaymentNotice();

        return redirect()->route('booking.checkout', $booking->code);
    }

    public function checkout(Request $request, Booking $booking)
    {
        Gate::authorize('view', $booking);

        if ($booking->hasExpired()) {
            Booking::expireStale();

            return redirect()->route('booking.status', $booking->code);
        }

        if ($booking->paid_amount > 0) {
            return redirect()->route('booking.status', $booking->code);
        }

        $booking->loadMissing(['court:id,name,type', 'items']);
        $user = $request->user();
        $dpPercentage = (int) Setting::get('dp.percentage', 30);

        return Inertia::render('Booking/Checkout', [
            'booking' => $this->bookingPayload($booking) + [
                'guest_url' => $booking->isGuest() ? $booking->guestUrl() : null,
            ],
            'dp' => [
                'available' => $booking->canPayDp(),
                'percentage' => $dpPercentage,
                'amount' => (int) ceil($booking->total * $dpPercentage / 100 / 1000) * 1000,
                'reason' => $this->dpBlocker($booking, $user),
                'settleBeforeHours' => (int) Setting::get('dp.settle_before_hours', 3),
            ],
            'snap' => [
                'enabled' => Payment::midtransConfigured() && filled(config('midtrans.client_key')),
                'clientKey' => config('midtrans.client_key'),
                'isProduction' => (bool) config('midtrans.is_production'),
            ],
        ]);
    }

    /**
     * Ringkasan booking yang aman dikirim ke halaman publik.
     *
     * @return array<string, mixed>
     */
    public static function bookingPayload(Booking $booking): array
    {
        $booking->loadMissing(['court:id,name,type', 'items']);

        return [
            ...$booking->only([
                'code', 'customer_name', 'customer_email', 'customer_phone', 'date', 'start_time', 'end_time',
                'players_count', 'notes', 'subtotal', 'discount', 'service_fee', 'total', 'payment_option',
                'dp_percentage', 'dp_amount', 'paid_amount', 'remaining_amount', 'settlement_due_at',
                'status', 'payment_status', 'customer_type', 'expires_at',
            ]),
            'court' => $booking->court?->only(['id', 'name', 'type']),
            'items' => $booking->items->map->only(['start_time', 'end_time', 'price', 'price_label'])->values(),
        ];
    }

    /**
     * Alasan opsi DP terkunci, untuk ditampilkan di checkout (null bila tersedia).
     */
    protected function dpBlocker(Booking $booking, ?User $user): ?string
    {
        return match (true) {
            $booking->canPayDp() => null,
            ! (bool) Setting::get('dp.enabled', true) => 'Pembayaran DP sedang dinonaktifkan.',
            ! $user => 'Khusus member. Daftar gratis untuk bisa bayar DP.',
            ! $user->hasVerifiedEmail() => 'Verifikasi email dulu untuk bisa bayar DP.',
            ! $user->canUseDp() => 'Akses DP untuk akun ini sedang tidak tersedia.',
            default => 'DP hanya untuk jadwal minimal H-'.(int) Setting::get('dp.min_days_ahead', 1)
                .' dan maksimal '.(int) Setting::get('dp.max_unsettled_per_user', 2).' booking DP aktif.',
        };
    }

    /**
     * BR-06 & BR-G5: batasi booking pending agar slot tidak ditahan massal, dan
     * BR-13: customer yang diblokir tidak boleh membuat booking baru.
     */
    protected function guardBookingLimits(Request $request, ?string $email): void
    {
        $pending = Booking::query()
            ->where('status', BookingStatus::Pending)
            ->where('expires_at', '>', now());

        if ($user = $request->user()) {
            if ($user->is_blocked) {
                throw ValidationException::withMessages(['slots' => 'Akun Anda sedang tidak dapat membuat booking. Hubungi admin.']);
            }

            $max = (int) Setting::get('booking.max_pending_per_user', 2);

            if ((clone $pending)->where('user_id', $user->id)->count() >= $max) {
                throw ValidationException::withMessages([
                    'slots' => "Anda masih punya {$max} booking yang menunggu pembayaran. Selesaikan dulu sebelum booking lagi.",
                ]);
            }

            return;
        }

        if (! Setting::get('guest.enabled', true)) {
            throw ValidationException::withMessages(['slots' => 'Booking tanpa akun sedang ditutup. Silakan masuk terlebih dahulu.']);
        }

        if ($email && (clone $pending)->forEmail($email)->exists()) {
            throw ValidationException::withMessages([
                'customer_email' => 'Email ini masih punya booking yang menunggu pembayaran. Selesaikan dulu pembayarannya.',
            ]);
        }

        $perHour = (int) Setting::get('guest.max_bookings_per_ip_hour', 3);

        $fromIp = Booking::query()
            ->whereNull('user_id')
            ->where('ip_address', $request->ip())
            ->where('created_at', '>=', now()->subHour())
            ->count();

        if ($fromIp >= $perHour) {
            throw ValidationException::withMessages(['slots' => 'Terlalu banyak booking dari perangkat ini. Coba lagi satu jam lagi.']);
        }
    }

    /**
     * Harga & ketersediaan dihitung ulang di server (BR-07); slot wajib kosong dan berurutan (BR-02).
     *
     * @param  list<string>  $selected
     * @return list<array<string, mixed>>
     */
    protected function resolveSlots(Court $court, CarbonImmutable $date, array $selected): array
    {
        $byStart = collect($court->availabilityOn($date))->keyBy('start_time');
        sort($selected);

        $slots = [];

        foreach ($selected as $index => $startTime) {
            $slot = $byStart->get($startTime);

            if (! $slot || $slot['status'] !== 'available') {
                throw ValidationException::withMessages([
                    'slots' => 'Jam '.substr($startTime, 0, 5).' baru saja dipesan orang lain. Muat ulang jadwal lalu pilih jam lain.',
                ]);
            }

            if ($index > 0 && $slots[$index - 1]['end_time'] !== $startTime) {
                throw ValidationException::withMessages(['slots' => 'Jam yang dipilih harus berurutan tanpa jeda.']);
            }

            $slots[] = $slot;
        }

        return $slots;
    }
}
