<?php

namespace App\Models;

use App\Enums\PaymentProvider;
use App\Enums\PaymentType;
use App\Enums\TransactionStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class Payment extends Model
{
    protected $fillable = [
        'booking_id',
        'type',
        'provider',
        'order_id',
        'amount',
        'status',
        'snap_token',
        'snap_redirect_url',
        'transaction_id',
        'payment_method',
        'fraud_status',
        'paid_at',
        'expires_at',
        'recorded_by',
        'raw_response',
    ];

    protected $attributes = [
        'provider' => 'midtrans',
        'status' => 'pending',
    ];

    protected $hidden = [
        'raw_response',
    ];

    protected function casts(): array
    {
        return [
            'type' => PaymentType::class,
            'provider' => PaymentProvider::class,
            'status' => TransactionStatus::class,
            'amount' => 'integer',
            'raw_response' => 'array',
            'paid_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(PaymentLog::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function scopeSettled(Builder $query): void
    {
        $query->where('status', TransactionStatus::Settlement);
    }

    public function scopeOpen(Builder $query): void
    {
        $query->where('status', TransactionStatus::Pending);
    }

    public function isSettled(): bool
    {
        return $this->status === TransactionStatus::Settlement;
    }

    public function isOpen(): bool
    {
        return $this->status === TransactionStatus::Pending && ! $this->hasExpired();
    }

    public function hasExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    /**
     * URL gambar QR dari Core API (actions[].generate-qr-code), disimpan di snap_redirect_url.
     */
    public function qrUrl(): ?string
    {
        return $this->snap_redirect_url;
    }

    /*
    |--------------------------------------------------------------------------
    | Midtrans
    |--------------------------------------------------------------------------
    */

    public static function midtransBaseUrl(): string
    {
        return config('midtrans.is_production') ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
    }

    /**
     * Core API pakai HTTP Basic: server key sebagai username, password kosong.
     */
    public static function midtrans(): PendingRequest
    {
        return Http::withBasicAuth((string) config('midtrans.server_key'), '')
            ->acceptJson()
            ->asJson()
            ->timeout(20)
            ->baseUrl(self::midtransBaseUrl());
    }

    public static function midtransConfigured(): bool
    {
        return filled(config('midtrans.server_key'));
    }

    /**
     * Order id wajib unik seumur merchant, jadi kode booking disuffix penanda acak.
     */
    public static function newOrderId(Booking $booking, PaymentType $type): string
    {
        return Str::limit("{$booking->code}-{$type->value}-".Str::upper(Str::random(6)), 50, '');
    }

    /**
     * Snap dilayani dari host app.*, berbeda dengan Core API di api.*.
     */
    public static function snapBaseUrl(): string
    {
        return config('midtrans.is_production') ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
    }

    /**
     * Buat transaksi Snap untuk booking online (bayar penuh, DP, atau pelunasan).
     * Nominal selalu dikirim dari hasil hitung server, bukan dari client.
     */
    public static function chargeSnap(Booking $booking, int $amount, PaymentType $type, ?int $expiryMinutes = null): self
    {
        $expiryMinutes = max(1, $expiryMinutes ?? (int) config('midtrans.expiry_minutes', 15));
        $orderId = self::newOrderId($booking, $type);

        $response = self::midtrans()->baseUrl(self::snapBaseUrl())->post('/snap/v1/transactions', [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $amount,
            ],
            'item_details' => [[
                'id' => $booking->code,
                'name' => Str::limit(self::itemName($booking, $type), 50, ''),
                'price' => $amount,
                'quantity' => 1,
            ]],
            'customer_details' => array_filter([
                'first_name' => $booking->customer_name,
                'email' => $booking->customer_email,
                'phone' => $booking->customer_phone,
            ]),
            'expiry' => [
                'unit' => 'minute',
                'duration' => $expiryMinutes,
            ],
            'callbacks' => [
                'finish' => route('booking.status', $booking->code),
            ],
        ]);

        $body = $response->json() ?? [];

        PaymentLog::create([
            'order_id' => $orderId,
            'event' => 'snap',
            'payload' => $body,
        ]);

        $response->throw();

        $payment = $booking->payments()->create([
            'type' => $type,
            'provider' => PaymentProvider::Midtrans,
            'order_id' => $orderId,
            'amount' => $amount,
            'status' => TransactionStatus::Pending,
            'snap_token' => $body['token'] ?? null,
            'snap_redirect_url' => $body['redirect_url'] ?? null,
            'expires_at' => now()->addMinutes($expiryMinutes),
            'raw_response' => $body,
        ]);

        PaymentLog::query()->where('order_id', $orderId)->whereNull('payment_id')->update(['payment_id' => $payment->id]);

        return $payment;
    }

    protected static function itemName(Booking $booking, PaymentType $type): string
    {
        return match ($type) {
            PaymentType::Dp => "DP booking {$booking->code}",
            PaymentType::Settlement => "Pelunasan booking {$booking->code}",
            default => "Booking {$booking->code}",
        };
    }

    /**
     * Buat transaksi QRIS Core API untuk dipindai customer di tempat.
     * Mengembalikan payment berstatus pending beserta URL gambar QR.
     */
    public static function chargeQris(Booking $booking, int $amount, PaymentType $type, ?int $recordedBy = null): self
    {
        $expiryMinutes = max(1, (int) config('midtrans.expiry_minutes', 15));
        $orderId = self::newOrderId($booking, $type);

        $response = self::midtrans()->post('/v2/charge', [
            'payment_type' => 'qris',
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $amount,
            ],
            'qris' => [
                'acquirer' => config('midtrans.qris_acquirer', 'gopay'),
            ],
            'item_details' => [[
                'id' => $booking->code,
                'name' => Str::limit('Booking '.$booking->code, 50, ''),
                'price' => $amount,
                'quantity' => 1,
            ]],
            'customer_details' => array_filter([
                'first_name' => $booking->customer_name,
                'email' => $booking->customer_email,
                'phone' => $booking->customer_phone,
            ]),
            'custom_expiry' => [
                'expiry_duration' => $expiryMinutes,
                'unit' => 'minute',
            ],
        ]);

        $body = $response->json() ?? [];

        PaymentLog::create([
            'order_id' => $orderId,
            'event' => 'charge',
            'payload' => $body,
        ]);

        $response->throw();

        $payment = $booking->payments()->create([
            'type' => $type,
            'provider' => PaymentProvider::Midtrans,
            'order_id' => $orderId,
            'amount' => $amount,
            'status' => TransactionStatus::Pending,
            'transaction_id' => $body['transaction_id'] ?? null,
            'payment_method' => 'qris',
            'snap_redirect_url' => collect($body['actions'] ?? [])->firstWhere('name', 'generate-qr-code')['url'] ?? null,
            'expires_at' => isset($body['expiry_time'])
                ? CarbonImmutable::parse($body['expiry_time'], Booking::TIMEZONE)
                : now()->addMinutes($expiryMinutes),
            'recorded_by' => $recordedBy,
            'raw_response' => $body,
        ]);

        PaymentLog::query()->where('order_id', $orderId)->whereNull('payment_id')->update(['payment_id' => $payment->id]);

        $payment->applyMidtransStatus($body);

        return $payment->refresh();
    }

    /**
     * Tarik ulang status dari Status API. Dipakai saat polling halaman QR supaya
     * pembayaran tetap terdeteksi walau webhook belum/tidak sampai (mis. saat lokal).
     */
    public function syncFromMidtrans(): void
    {
        if ($this->provider !== PaymentProvider::Midtrans || ! self::midtransConfigured() || ! $this->isSettledCandidate()) {
            return;
        }

        $response = self::midtrans()->get("/v2/{$this->order_id}/status");
        $body = $response->json() ?? [];

        if (! $response->successful() || ! isset($body['transaction_status'])) {
            return;
        }

        PaymentLog::create([
            'payment_id' => $this->id,
            'order_id' => $this->order_id,
            'event' => 'status',
            'payload' => $body,
        ]);

        $this->applyMidtransStatus($body);
    }

    protected function isSettledCandidate(): bool
    {
        return $this->status === TransactionStatus::Pending;
    }

    /**
     * BR: status pembayaran hanya bergerak dari payload Midtrans yang sudah diverifikasi.
     * Idempotent — notifikasi ganda tidak menambah nominal terbayar.
     */
    public function applyMidtransStatus(array $payload): void
    {
        $status = self::mapTransactionStatus($payload);

        if ($status === null || $status === $this->status) {
            return;
        }

        // Amount mismatch dianggap tidak sah: jangan konfirmasi booking.
        if ($status === TransactionStatus::Settlement && isset($payload['gross_amount']) && (int) $payload['gross_amount'] !== $this->amount) {
            PaymentLog::create([
                'payment_id' => $this->id,
                'order_id' => $this->order_id,
                'event' => 'amount_mismatch',
                'payload' => $payload,
            ]);

            return;
        }

        $this->forceFill([
            'status' => $status,
            'transaction_id' => $payload['transaction_id'] ?? $this->transaction_id,
            'payment_method' => $payload['payment_type'] ?? $this->payment_method,
            'fraud_status' => $payload['fraud_status'] ?? $this->fraud_status,
            'paid_at' => $status === TransactionStatus::Settlement
                ? ($payload['settlement_time'] ?? $payload['transaction_time'] ?? now())
                : $this->paid_at,
            'raw_response' => $payload,
        ])->save();

        $this->booking->syncFromPayments();
    }

    /**
     * @return TransactionStatus|null null bila status Midtrans tidak dikenal
     */
    public static function mapTransactionStatus(array $payload): ?TransactionStatus
    {
        $status = $payload['transaction_status'] ?? null;
        $fraud = $payload['fraud_status'] ?? null;

        return match ($status) {
            'capture' => $fraud === 'challenge' ? TransactionStatus::Pending : TransactionStatus::Settlement,
            'settlement' => TransactionStatus::Settlement,
            'pending' => TransactionStatus::Pending,
            'deny', 'cancel', 'failure' => TransactionStatus::Failed,
            'expire' => TransactionStatus::Expired,
            'refund', 'partial_refund' => TransactionStatus::Refunded,
            default => null,
        };
    }

    /**
     * Signature Midtrans: sha512(order_id + status_code + gross_amount + server_key).
     */
    public static function midtransSignatureIsValid(array $payload): bool
    {
        $signature = $payload['signature_key'] ?? null;

        if (! is_string($signature) || ! self::midtransConfigured()) {
            return false;
        }

        $expected = hash('sha512', ($payload['order_id'] ?? '')
            .($payload['status_code'] ?? '')
            .($payload['gross_amount'] ?? '')
            .config('midtrans.server_key'));

        return hash_equals($expected, $signature);
    }
}
