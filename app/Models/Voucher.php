<?php

namespace App\Models;

use App\Enums\VoucherType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Voucher extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'type',
        'value',
        'max_discount',
        'min_amount',
        'quota',
        'used_count',
        'members_only',
        'starts_at',
        'ends_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'type' => VoucherType::class,
            'value' => 'integer',
            'max_discount' => 'integer',
            'min_amount' => 'integer',
            'quota' => 'integer',
            'used_count' => 'integer',
            'members_only' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }

    /**
     * Alasan voucher tidak bisa dipakai untuk booking ini, atau null bila valid.
     * Semua syarat dicek ulang di server saat voucher dipasang maupun saat dibayar.
     */
    public function rejectionFor(Booking $booking): ?string
    {
        return match (true) {
            ! $this->is_active => 'Voucher ini sudah tidak berlaku.',
            $this->starts_at && $this->starts_at->isFuture() => 'Voucher ini belum bisa dipakai.',
            $this->ends_at && $this->ends_at->isPast() => 'Voucher ini sudah kedaluwarsa.',
            $this->quota !== null && $this->used_count >= $this->quota => 'Kuota voucher ini sudah habis.',
            $this->members_only && $booking->isGuest() => 'Voucher ini khusus member. Masuk dulu untuk memakainya.',
            $booking->subtotal + $booking->service_fee < $this->min_amount => 'Minimal transaksi '.$this->formattedMinimum().' untuk memakai voucher ini.',
            default => null,
        };
    }

    /**
     * Nilai potongan untuk sebuah booking, dibatasi max_discount dan tidak pernah
     * melebihi nilai tagihannya sendiri.
     */
    public function discountFor(Booking $booking): int
    {
        $base = $booking->subtotal + $booking->service_fee;

        $discount = $this->type === VoucherType::Percent
            ? (int) floor($base * $this->value / 100)
            : $this->value;

        if ($this->max_discount) {
            $discount = min($discount, $this->max_discount);
        }

        return max(0, min($discount, $base));
    }

    public function formattedMinimum(): string
    {
        return 'Rp'.number_format($this->min_amount, 0, ',', '.');
    }

    /**
     * Label singkat untuk ditampilkan di checkout, mis. "Diskon 20%" atau "Potongan Rp50.000".
     */
    public function label(): string
    {
        return $this->type === VoucherType::Percent
            ? "Diskon {$this->value}%"
            : 'Potongan Rp'.number_format($this->value, 0, ',', '.');
    }
}
