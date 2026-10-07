<?php

namespace App\Models;

use App\Enums\BookingSource;
use App\Enums\BookingStatus;
use App\Enums\CustomerType;
use App\Enums\PaymentOption;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\RefundStatus;
use App\Enums\ReminderChannel;
use App\Enums\ReminderType;
use App\Enums\TransactionStatus;
use App\Mail\BookingExpiredMail;
use App\Mail\BookingPendingMail;
use App\Mail\PaymentReceiptMail;
use App\Mail\SettlementReminderMail;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class Booking extends Model
{
    use HasFactory;

    public const TIMEZONE = 'Asia/Jakarta';

    protected const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

    protected $fillable = [
        'code',
        'user_id',
        'court_id',
        'voucher_id',
        'customer_type',
        'customer_name',
        'customer_email',
        'customer_phone',
        'date',
        'start_time',
        'end_time',
        'players_count',
        'notes',
        'subtotal',
        'discount',
        'service_fee',
        'total',
        'payment_option',
        'dp_percentage',
        'dp_amount',
        'paid_amount',
        'remaining_amount',
        'settlement_due_at',
        'status',
        'payment_status',
        'source',
        'expires_at',
        'confirmed_at',
        'paid_at',
        'checked_in_at',
        'checked_in_by',
        'cancelled_at',
        'cancelled_by',
        'cancel_reason',
        'refund_status',
        'refund_amount',
        'created_by',
        'ip_address',
        'anonymized_at',
    ];

    protected $attributes = [
        'status' => 'pending',
        'payment_status' => 'unpaid',
        'payment_option' => 'full',
        'source' => 'online',
        'refund_status' => 'none',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'customer_type' => CustomerType::class,
            'payment_option' => PaymentOption::class,
            'status' => BookingStatus::class,
            'payment_status' => PaymentStatus::class,
            'refund_status' => RefundStatus::class,
            'source' => BookingSource::class,
            'players_count' => 'integer',
            'subtotal' => 'integer',
            'discount' => 'integer',
            'service_fee' => 'integer',
            'total' => 'integer',
            'dp_percentage' => 'integer',
            'dp_amount' => 'integer',
            'paid_amount' => 'integer',
            'remaining_amount' => 'integer',
            'refund_amount' => 'integer',
            'settlement_due_at' => 'datetime',
            'expires_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'paid_at' => 'datetime',
            'checked_in_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'anonymized_at' => 'datetime',
        ];
    }

    protected function customerEmail(): Attribute
    {
        return Attribute::set(fn (?string $value) => $value === null ? null : Str::lower(trim($value)));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class)->withTrashed();
    }

    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(BookingItem::class)->orderBy('start_time');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function latestPayment(): HasOne
    {
        return $this->hasOne(Payment::class)->latestOfMany();
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(PaymentReminder::class);
    }

    public function checkedInBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_in_by');
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeUpcoming(Builder $query): void
    {
        $now = now(self::TIMEZONE);

        $query->where(fn (Builder $query) => $query
            ->whereDate('date', '>', $now->toDateString())
            ->orWhere(fn (Builder $query) => $query
                ->whereDate('date', $now->toDateString())
                ->where('start_time', '>=', $now->format('H:i:s'))));
    }

    public function scopePast(Builder $query): void
    {
        $now = now(self::TIMEZONE);

        $query->where(fn (Builder $query) => $query
            ->whereDate('date', '<', $now->toDateString())
            ->orWhere(fn (Builder $query) => $query
                ->whereDate('date', $now->toDateString())
                ->where('start_time', '<', $now->format('H:i:s'))));
    }

    public function scopeActive(Builder $query): void
    {
        $query->whereIn('status', [
            BookingStatus::Pending,
            BookingStatus::Confirmed,
            BookingStatus::CheckedIn,
        ]);
    }

    public function scopeExpirable(Builder $query): void
    {
        $query->where('status', BookingStatus::Pending)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now());
    }

    public function scopeUnsettled(Builder $query): void
    {
        $query->where('payment_status', PaymentStatus::DpPaid);
    }

    public function scopeForEmail(Builder $query, string $email): void
    {
        $query->where('customer_email', Str::lower(trim($email)));
    }

    public static function generateCode(): string
    {
        do {
            $code = 'PBS-';

            for ($i = 0; $i < 6; $i++) {
                $code .= self::CODE_ALPHABET[random_int(0, strlen(self::CODE_ALPHABET) - 1)];
            }
        } while (static::query()->where('code', $code)->exists());

        return $code;
    }

    public function startsAt(): CarbonImmutable
    {
        return CarbonImmutable::parse($this->date->format('Y-m-d').' '.$this->start_time, self::TIMEZONE);
    }

    public function isGuest(): bool
    {
        return $this->customer_type === CustomerType::Guest;
    }

    /**
     * BR-G2, BR-DP1, BR-DP3, BR-DP7.
     */
    public function canPayDp(): bool
    {
        if ($this->isGuest() || ! $this->user || ! $this->user->canUseDp() || ! Setting::get('dp.enabled', true)) {
            return false;
        }

        $earliestDate = now(self::TIMEZONE)->startOfDay()->addDays((int) Setting::get('dp.min_days_ahead', 1));

        if ($this->startsAt()->lt($earliestDate)) {
            return false;
        }

        $unsettledCount = static::query()
            ->where('user_id', $this->user_id)
            ->whereKeyNot($this->getKey())
            ->unsettled()
            ->active()
            ->count();

        return $unsettledCount < (int) Setting::get('dp.max_unsettled_per_user', 2);
    }

    /**
     * BR-09: booking pending selalu bisa dibatalkan; confirmed hanya sebelum batas jam.
     */
    public function canBeCancelled(): bool
    {
        return match ($this->status) {
            BookingStatus::Pending => true,
            BookingStatus::Confirmed => $this->startsAt()
                ->subHours((int) Setting::get('booking.cancel_before_hours', 24))
                ->isFuture(),
            default => false,
        };
    }

    /**
     * Admin/staff boleh membatalkan booking yang belum dimainkan tanpa terikat batas jam kebijakan customer.
     */
    public function isCancellableByStaff(): bool
    {
        return in_array($this->status, [BookingStatus::Pending, BookingStatus::Confirmed], true);
    }

    /**
     * 8.11: alasan booking belum bisa check-in, atau null bila boleh (confirmed, hari ini, lunas).
     */
    public function checkInBlocker(): ?string
    {
        return match (true) {
            $this->status === BookingStatus::CheckedIn => 'Booking ini sudah check-in.',
            $this->status !== BookingStatus::Confirmed => 'Hanya booking berstatus terkonfirmasi yang bisa check-in.',
            $this->date->toDateString() !== now(self::TIMEZONE)->toDateString() => 'Check-in hanya bisa dilakukan pada hari main.',
            $this->payment_status !== PaymentStatus::Paid => 'Booking belum lunas. Catat pelunasan terlebih dahulu.',
            default => null,
        };
    }

    /**
     * Isi QR e-ticket: link scan ber-signature yang dibuka staff saat check-in.
     * Berlaku sampai akhir hari main supaya tidak bisa dipakai ulang besoknya.
     */
    public function scanUrl(): string
    {
        return URL::temporarySignedRoute(
            'staff.scan',
            $this->startsAt()->endOfDay()->addDay(),
            ['booking' => $this->code],
        );
    }

    /**
     * QR e-ticket sebagai data URI SVG, siap dipasang di <img src>.
     */
    public function qrCode(int $size = 320): string
    {
        $writer = new Writer(
            new ImageRenderer(
                new RendererStyle($size, 1),
                new SvgImageBackEnd,
            ),
        );

        return 'data:image/svg+xml;base64,'.base64_encode($writer->writeString($this->scanUrl()));
    }

    /**
     * Catat kedatangan pemain. Mengembalikan alasan penolakan, atau null bila berhasil.
     */
    public function checkIn(int $staffId): ?string
    {
        if ($blocker = $this->checkInBlocker()) {
            return $blocker;
        }

        $this->forceFill([
            'status' => BookingStatus::CheckedIn,
            'checked_in_at' => now(),
            'checked_in_by' => $staffId,
        ])->save();

        return null;
    }

    /**
     * BR-DP2: dibulatkan ke atas    /**
     * BR-DP2: dibulatkan ke atas    /**
     * BR-DP2: dibulatkan ke atas ke kelipatan Rp1.000.
     */
    public function calculateDpAmount(): int
    {
        if (! $this->dp_percentage) {
            return 0;
        }

        return min($this->total, (int) ceil($this->total * $this->dp_percentage / 100 / 1000) * 1000);
    }

    /**
     * I-3 & I-4: sinkronkan paid_amount, remaining_amount, dan payment_status dari pembayaran settlement.
     */
    public function recalculatePaidAmount(): void
    {
        $paid = (int) $this->payments()->settled()->sum('amount');

        $this->paid_amount = $paid;
        $this->remaining_amount = max(0, $this->total - $paid);

        if (! in_array($this->payment_status, [PaymentStatus::Refunded, PaymentStatus::PartiallyRefunded], true)) {
            $this->payment_status = match (true) {
                $paid >= $this->total => PaymentStatus::Paid,
                $paid > 0 => PaymentStatus::DpPaid,
                default => PaymentStatus::Unpaid,
            };

            if ($this->payment_status === PaymentStatus::Paid && ! $this->paid_at) {
                $this->paid_at = now();
            }
        }

        $this->save();
    }

    /**
     * Dipanggil setiap kali ada transaksi yang settle: samakan nominal terbayar lalu
     * naikkan status booking menjadi terkonfirmasi begitu ada uang masuk.
     */
    public function syncFromPayments(): void
    {
        $this->recalculatePaidAmount();

        if ($this->paid_amount > 0 && $this->status === BookingStatus::Pending) {
            $this->forceFill([
                'status' => BookingStatus::Confirmed,
                'confirmed_at' => $this->confirmed_at ?? now(),
                'expires_at' => null,
            ])->save();
        }

        Invoice::issueFor($this);

        $this->sendPaymentReceipt();
    }

    /**
     * Bukti pembayaran ke email pemesan. Dikirim sekali untuk DP dan sekali lagi saat
     * lunas; unique index payment_reminders yang menjaga agar tidak terkirim ganda
     * walau webhook Midtrans datang berkali-kali.
     */
    public function sendPaymentReceipt(): void
    {
        $type = match ($this->payment_status) {
            PaymentStatus::Paid => ReminderType::PaymentPaid,
            PaymentStatus::DpPaid => ReminderType::PaymentDp,
            default => null,
        };

        if (! $type || ! $this->customer_email) {
            return;
        }

        $reminder = $this->reminders()->firstOrCreate(
            ['type' => $type, 'channel' => ReminderChannel::Email],
            ['sent_at' => now()],
        );

        if (! $reminder->wasRecentlyCreated) {
            return;
        }

        Mail::to($this->customer_email)->queue(new PaymentReceiptMail($this));
    }

    /**
     * BR-G3: email "Selesaikan Pembayaran" begitu booking dibuat, sekali saja.
     */
    public function sendPendingPaymentNotice(): void
    {
        if (! $this->customer_email || $this->paid_amount > 0) {
            return;
        }

        $reminder = $this->reminders()->firstOrCreate(
            ['type' => ReminderType::PendingPayment, 'channel' => ReminderChannel::Email],
            ['sent_at' => now()],
        );

        if (! $reminder->wasRecentlyCreated) {
            return;
        }

        Mail::to($this->customer_email)->queue(new BookingPendingMail($this));
    }

    /**
     * Pemberitahuan booking kedaluwarsa beserta ajakan memesan ulang.
     */
    public function sendExpiredNotice(): void
    {
        if (! $this->customer_email) {
            return;
        }

        $reminder = $this->reminders()->firstOrCreate(
            ['type' => ReminderType::BookingExpired, 'channel' => ReminderChannel::Email],
            ['sent_at' => now()],
        );

        if ($reminder->wasRecentlyCreated) {
            Mail::to($this->customer_email)->queue(new BookingExpiredMail($this));
        }
    }

    /**
     * BR-DP4: pengingat pelunasan H-1 dan 6 jam sebelum batas pelunasan.
     */
    public function sendSettlementReminder(ReminderType $type): bool
    {
        if (! $this->customer_email) {
            return false;
        }

        $reminder = $this->reminders()->firstOrCreate(
            ['type' => $type, 'channel' => ReminderChannel::Email],
            ['sent_at' => now()],
        );

        if (! $reminder->wasRecentlyCreated) {
            return false;
        }

        Mail::to($this->customer_email)->queue(new SettlementReminderMail($this));

        return true;
    }

    /**
     * Booking DP yang batas pelunasannya tinggal <= $hours jam lagi dan belum lunas.
     *
     * @return Collection<int, self>
     */
    public static function dueForSettlementReminder(int $hours, ReminderType $type): Collection
    {
        return static::query()
            ->with('court:id,name')
            ->unsettled()
            ->active()
            ->whereNotNull('settlement_due_at')
            ->where('settlement_due_at', '>', now())
            ->where('settlement_due_at', '<=', now()->addHours($hours))
            ->whereDoesntHave('reminders', fn (Builder $query) => $query
                ->where('type', $type)
                ->where('channel', ReminderChannel::Email))
            ->get();
    }

    /**
     * BR-DP6: booking DP yang tidak dilunasi dan pemainnya tidak datang sampai
     * $graceMinutes setelah jam mulai.
     *
     * @return Collection<int, self>
     */
    public static function dueForNoShow(int $graceMinutes): Collection
    {
        $now = now(self::TIMEZONE);

        return static::query()
            ->with('user')
            ->where('status', BookingStatus::Confirmed)
            ->where('payment_status', '!=', PaymentStatus::Paid)
            ->whereDate('date', '>=', $now->copy()->subDay()->toDateString())
            ->whereDate('date', '<=', $now->toDateString())
            ->get()
            ->filter(fn (self $booking) => $booking->startsAt()->addMinutes($graceMinutes)->isPast());
    }

    /**
     * Booking yang jam mainnya sudah lewat dan sudah lunas — ditutup sebagai selesai.
     *
     * @return Collection<int, self>
     */
    public static function dueForCompletion(): Collection
    {
        $now = now(self::TIMEZONE);

        return static::query()
            ->whereIn('status', [BookingStatus::Confirmed, BookingStatus::CheckedIn])
            ->where('payment_status', PaymentStatus::Paid)
            ->whereDate('date', '>=', $now->copy()->subDays(2)->toDateString())
            ->whereDate('date', '<=', $now->toDateString())
            ->get()
            ->filter(fn (self $booking) => CarbonImmutable::parse($booking->date->format('Y-m-d').' '.$booking->end_time, self::TIMEZONE)->isPast());
    }

    /**
     * BR-DP6: tandai no-show. DP hangus, dan no-show berulang mencabut akses DP (BR-DP8).
     */
    public function markNoShow(): void
    {
        $this->forceFill(['status' => BookingStatus::NoShow])->save();
        $this->releaseSlots();
        $this->payments()->open()->update(['status' => TransactionStatus::Failed]);
        $this->user?->applyNoShowPenalty();
    }

    public function markCompleted(): void
    {
        $this->forceFill(['status' => BookingStatus::Completed])->save();
    }

    /**
     * Pengingat WhatsApp menjelang jam main (default 1 jam sebelum).
     */
    public function sendPlayReminder(): bool
    {
        $minutes = max(1, (int) round(now(self::TIMEZONE)->diffInMinutes($this->startsAt(), false)));
        $venue = Setting::get('venue.name', 'PBS Padel Club');
        $lead = $minutes >= 60 ? round($minutes / 60).' jam' : $minutes.' menit';

        $message = implode("\n", array_filter([
            "Halo {$this->customer_name}!",
            '',
            "Booking *{$this->code}* di {$venue} akan dimulai sekitar {$lead} lagi.",
            'Lapangan: '.($this->court?->name ?? '-'),
            'Jam: '.substr($this->start_time, 0, 5).'-'.substr($this->end_time, 0, 5).' WIB',
            $this->remaining_amount > 0
                ? 'Sisa tagihan: Rp'.number_format($this->remaining_amount, 0, ',', '.').' — bisa dilunasi online atau di venue sebelum main.'
                : null,
            '',
            'Pastikan datang on time ya. Sampai jumpa di lapangan!',
        ], fn ($line) => $line !== null));

        return PaymentReminder::sendWhatsapp($this, ReminderType::Play1h, $message);
    }

    /**
     * Booking terkonfirmasi yang jam mainnya tinggal <= $minutes lagi dan belum diingatkan.
     *
     * @return Collection<int, self>
     */
    public static function dueForPlayReminder(int $minutes): Collection
    {
        $now = now(self::TIMEZONE);
        $until = $now->copy()->addMinutes($minutes);

        return static::query()
            ->with('court:id,name')
            ->whereIn('status', [BookingStatus::Confirmed, BookingStatus::CheckedIn])
            ->whereBetween('date', [$now->toDateString(), $until->toDateString()])
            ->whereDoesntHave('reminders', fn (Builder $query) => $query
                ->where('type', ReminderType::Play1h)
                ->where('channel', ReminderChannel::Whatsapp))
            ->get()
            ->filter(fn (self $booking) => $booking->startsAt()->between($now, $until));
    }

    /**
     * Pencatatan pembayaran di tempat oleh staff/admin (tunai atau QRIS mesin venue).
     */
    public function recordOfflinePayment(int $amount, PaymentProvider $provider, PaymentType $type, int $recordedBy): Payment
    {
        $payment = $this->payments()->create([
            'type' => $type,
            'provider' => $provider,
            'order_id' => Payment::newOrderId($this, $type),
            'amount' => $amount,
            'status' => TransactionStatus::Settlement,
            'payment_method' => $provider->value,
            'paid_at' => now(),
            'recorded_by' => $recordedBy,
        ]);

        $this->syncFromPayments();

        return $payment;
    }

    /**
     * Transaksi QRIS Midtrans yang masih berlaku untuk dipindai ulang, bila ada.
     */
    public function openQrisPayment(): ?Payment
    {
        return $this->payments()
            ->where('provider', PaymentProvider::Midtrans)
            ->open()
            ->where(fn (Builder $query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->latest()
            ->first();
    }

    /**
     * BR-05: booking pending yang lewat batas bayar dilepas slotnya. Dipanggil scheduler
     * tiap menit, dan sekali lagi saat halaman jadwal dibuka agar slot lokal ikut segar.
     */
    public static function expireStale(): void
    {
        static::query()->expirable()->with(['items', 'court:id,name'])->get()->each(function (self $booking) {
            $booking->forceFill(['status' => BookingStatus::Expired])->save();
            $booking->releaseSlots();
            $booking->invoice?->syncFromBooking();
            $booking->sendExpiredNotice();
        });
    }

    public function hasExpired(): bool
    {
        return $this->status === BookingStatus::Expired
            || ($this->status === BookingStatus::Pending && $this->expires_at?->isPast());
    }

    public function isPayable(): bool
    {
        return $this->remaining_amount > 0
            && ! $this->hasExpired()
            && in_array($this->status, [BookingStatus::Pending, BookingStatus::Confirmed], true);
    }

    /**
     * Link akses booking untuk guest (dipakai di email "Selesaikan Pembayaran" & tombol
     * simpan link di checkout). Berlaku sampai 7 hari setelah tanggal main.
     */
    public function guestUrl(): string
    {
        return URL::temporarySignedRoute('booking.guest.show', $this->startsAt()->addDays(7), ['booking' => $this->code]);
    }

    /**
     * BR-DP2 & BR-DP4: kunci opsi DP pada booking beserta nominal dan batas pelunasannya.
     */
    public function applyDpOption(): void
    {
        $this->forceFill(['dp_percentage' => (int) Setting::get('dp.percentage', 30)]);

        $this->forceFill([
            'payment_option' => PaymentOption::Dp,
            'dp_amount' => $this->calculateDpAmount(),
            // Disimpan dalam UTC seperti kolom waktu lain; startsAt() berada di zona WIB.
            'settlement_due_at' => $this->startsAt()->subHours((int) Setting::get('dp.settle_before_hours', 3))->utc(),
        ])->save();
    }

    /**
     * Transaksi Snap yang masih berlaku untuk tipe & nominal yang sama, supaya klik
     * "Bayar" berulang tidak membuat order baru terus-menerus.
     */
    public function openSnapPayment(PaymentType $type, int $amount): ?Payment
    {
        return $this->payments()
            ->where('provider', PaymentProvider::Midtrans)
            ->where('type', $type)
            ->where('amount', $amount)
            ->whereNotNull('snap_token')
            ->open()
            ->where(fn (Builder $query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->latest()
            ->first();
    }

    /**
     * Pembatalan booking (oleh member maupun staff): slot dilepas, transaksi yang
     * masih pending dimatikan, dan refund ditandai bila sudah ada uang masuk.
     *
     * BR-09 & kebijakan DP: pembayaran penuh selalu bisa diajukan refund, DP hanya
     * bila pembatalan masih di luar batas jam yang diatur.
     */
    public function cancel(?int $cancelledBy = null, ?string $reason = null): void
    {
        $refundable = $this->paid_amount > 0 && ($this->payment_option !== PaymentOption::Dp
            || $this->startsAt()->subHours((int) Setting::get('dp.refundable_before_hours', 24))->isFuture());

        $this->forceFill([
            'status' => BookingStatus::Cancelled,
            'cancelled_at' => now(),
            'cancelled_by' => $cancelledBy,
            'cancel_reason' => $reason,
            'refund_status' => $refundable ? RefundStatus::Requested : $this->refund_status,
        ])->save();

        $this->releaseSlots();
        $this->payments()->open()->update(['status' => TransactionStatus::Failed]);
        $this->invoice?->syncFromBooking();
    }

    /**
     * BR-G7: booking tamu ditautkan ke akun begitu user login dengan email yang
     * sama dan email tersebut sudah terverifikasi.
     *
     * @return int jumlah booking yang tertaut
     */
    public static function claimFor(User $user): int
    {
        if (! $user->hasVerifiedEmail()) {
            return 0;
        }

        return static::query()
            ->whereNull('user_id')
            ->forEmail($user->email)
            ->update(['user_id' => $user->id, 'customer_type' => CustomerType::Member]);
    }

    /**
     * I-9: slot non-aktif wajib NULL (bukan false) agar unique index tidak bentrok.
     */
    public function releaseSlots(): void
    {
        $this->items()->update(['is_active' => null]);
    }
}
