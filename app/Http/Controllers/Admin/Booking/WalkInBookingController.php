<?php

namespace App\Http\Controllers\Admin\Booking;

use App\Enums\BookingSource;
use App\Enums\BookingStatus;
use App\Enums\CustomerType;
use App\Enums\PaymentOption;
use App\Enums\PaymentProvider;
use App\Enums\PaymentType;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Booking di tempat (walk-in) oleh owner/admin: pilih slot yang masih kosong, isi data
 * customer, lalu bayar tunai atau lewat QRIS Midtrans yang langsung dipindai customer.
 */
class WalkInBookingController extends Controller
{
    public function create(Request $request)
    {
        $filters = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
            'court_id' => ['nullable', 'integer'],
        ]);

        $courts = Court::query()->active()->orderBy('sort_order')->get(['id', 'name', 'type', 'base_price']);
        $date = CarbonImmutable::parse($filters['date'] ?? now(Booking::TIMEZONE)->toDateString(), Booking::TIMEZONE);
        $court = $courts->firstWhere('id', (int) ($filters['court_id'] ?? 0)) ?? $courts->first();

        return Inertia::render('Admin/Bookings/Create', [
            'courts' => $courts,
            'selected' => ['date' => $date->toDateString(), 'court_id' => $court?->id],
            'availability' => fn () => $court ? $this->availability($court, $date) : [],
            'limits' => [
                'maxSlots' => (int) Setting::get('booking.max_slots_per_booking', 3),
                'advanceDays' => (int) Setting::get('booking.advance_days', 14),
                'slotMinutes' => (int) Setting::get('booking.slot_duration_minutes', 60),
            ],
            'serviceFee' => (int) Setting::get('booking.service_fee', 0),
            'today' => now(Booking::TIMEZONE)->toDateString(),
            'qrisEnabled' => Payment::midtransConfigured(),
        ]);
    }

    public function store(Request $request)
    {
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
            'customer_email' => ['nullable', 'email', 'max:255'],
            'players_count' => ['required', 'integer', 'min:1', 'max:12'],
            'notes' => ['nullable', 'string', 'max:500'],
            'payment_method' => ['required', 'in:cash,qris,unpaid'],
        ]);

        $phone = User::normalizePhone($validated['customer_phone']);
        $date = CarbonImmutable::parse($validated['date'], Booking::TIMEZONE);

        $booking = DB::transaction(function () use ($request, $validated, $date, $phone) {
            $court = Court::query()->active()->lockForUpdate()->findOrFail($validated['court_id']);
            $slots = $this->resolveSlots($court, $date, $validated['slots']);

            $subtotal = array_sum(array_column($slots, 'price'));
            $serviceFee = (int) Setting::get('booking.service_fee', 0);
            $member = $this->findMember($validated['customer_email'] ?? null, $phone);

            $booking = Booking::create([
                'code' => Booking::generateCode(),
                'user_id' => $member?->id,
                'court_id' => $court->id,
                'customer_type' => $member ? CustomerType::Member : CustomerType::Guest,
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'] ?? null,
                'customer_phone' => $phone,
                'date' => $date->toDateString(),
                'start_time' => $slots[0]['start_time'],
                'end_time' => $slots[count($slots) - 1]['end_time'],
                'players_count' => $validated['players_count'],
                'notes' => $validated['notes'] ?? null,
                'subtotal' => $subtotal,
                'service_fee' => $serviceFee,
                'total' => $subtotal + $serviceFee,
                // Walk-in selalu bayar penuh di tempat; DP hanya untuk member yang booking online.
                'payment_option' => PaymentOption::Full,
                'remaining_amount' => $subtotal + $serviceFee,
                'status' => BookingStatus::Pending,
                'source' => BookingSource::WalkIn,
                'created_by' => $request->user()->id,
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

            if ($validated['payment_method'] === 'cash') {
                $booking->recordOfflinePayment($booking->total, PaymentProvider::Cash, PaymentType::Full, $request->user()->id);
            }

            return $booking;
        });

        Invoice::issueFor($booking);

        return match ($validated['payment_method']) {
            'qris' => redirect()->route('admin.bookings.payment', $booking),
            'cash' => redirect()->route('admin.bookings.show', $booking)
                ->with('success', "Booking {$booking->code} dibuat dan lunas tunai."),
            default => redirect()->route('admin.bookings.show', $booking)
                ->with('success', "Booking {$booking->code} dibuat. Catat pembayaran saat customer membayar."),
        };
    }

    /**
     * Slot beserta status & harga hari itu. Slot yang sedang berjalan tetap bisa dijual
     * di tempat selama jamnya belum habis.
     *
     * @return list<array<string, mixed>>
     */
    protected function availability(Court $court, CarbonImmutable $date): array
    {
        $now = now(Booking::TIMEZONE);

        return array_map(function (array $slot) use ($date, $now) {
            $endsAt = $date->setTimeFromTimeString($slot['end_time']);

            return [
                ...$slot,
                'status' => $slot['status'] === 'past' && $endsAt->gt($now) ? 'ongoing' : $slot['status'],
            ];
        }, $court->availabilityOn($date));
    }

    /**
     * Harga selalu dihitung ulang di server, dan slot wajib masih kosong + berurutan.
     *
     * @param  list<string>  $selected
     * @return list<array<string, mixed>>
     */
    protected function resolveSlots(Court $court, CarbonImmutable $date, array $selected): array
    {
        $byStart = collect($this->availability($court, $date))->keyBy('start_time');
        sort($selected);

        $slots = [];

        foreach ($selected as $index => $startTime) {
            $slot = $byStart->get($startTime);

            if (! $slot || ! in_array($slot['status'], ['available', 'ongoing'], true)) {
                throw ValidationException::withMessages([
                    'slots' => 'Slot '.substr($startTime, 0, 5).' sudah tidak tersedia. Muat ulang jadwal lalu pilih lagi.',
                ]);
            }

            if ($index > 0 && $slots[$index - 1]['end_time'] !== $startTime) {
                throw ValidationException::withMessages(['slots' => 'Jam yang dipilih harus berurutan tanpa jeda.']);
            }

            $slots[] = $slot;
        }

        return $slots;
    }

    /**
     * Walk-in tetap dihubungkan ke akun member bila email/nomornya sudah terdaftar.
     */
    protected function findMember(?string $email, ?string $phone): ?User
    {
        return User::query()
            ->where('role', UserRole::Customer)
            ->where('is_blocked', false)
            ->where(function ($query) use ($email, $phone) {
                $query->whereRaw('1 = 0');

                if ($email) {
                    $query->orWhere('email', $email);
                }

                if ($phone) {
                    $query->orWhere('phone', $phone);
                }
            })
            ->first();
    }
}
