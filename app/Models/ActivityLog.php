<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'action',
        'subject_type',
        'subject_id',
        'properties',
        'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'properties' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Catat aksi penting (uang, akses, kebijakan). Dipanggil dari controller
     * setelah aksinya berhasil; pencatatan tidak boleh menggagalkan aksi utama.
     *
     * @param  array<string, mixed>  $properties
     */
    public static function record(string $action, ?Model $subject = null, array $properties = []): self
    {
        return static::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'properties' => $properties ?: null,
            'ip_address' => request()->ip(),
        ]);
    }

    /**
     * Label aksi dalam bahasa Indonesia untuk halaman log.
     */
    public function label(): string
    {
        return match ($this->action) {
            'payment.recorded' => 'Pembayaran dicatat',
            'payment.refunded' => 'Refund diperbarui',
            'booking.cancelled' => 'Booking dibatalkan',
            'booking.checked_in' => 'Check-in',
            'booking.walk_in' => 'Booking walk-in dibuat',
            'settings.updated' => 'Pengaturan diubah',
            'court.updated' => 'Lapangan diubah',
            'court.pricing' => 'Harga lapangan diubah',
            'schedule.blocked' => 'Slot diblokir',
            'schedule.unblocked' => 'Blokir slot dihapus',
            'voucher.saved' => 'Voucher disimpan',
            'voucher.deleted' => 'Voucher dihapus',
            'user.saved' => 'User disimpan',
            'user.toggled' => 'Status user diubah',
            'customer.blocked' => 'Customer diblokir/dibuka',
            default => $this->action,
        };
    }
}
