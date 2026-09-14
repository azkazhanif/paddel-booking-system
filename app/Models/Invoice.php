<?php

namespace App\Models;

use App\Enums\InvoiceStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    protected $fillable = [
        'booking_id',
        'number',
        'status',
        'billed_name',
        'billed_email',
        'billed_phone',
        'subtotal',
        'discount',
        'service_fee',
        'total',
        'paid_amount',
        'remaining_amount',
        'issued_at',
        'paid_at',
        'pdf_path',
        'last_sent_at',
    ];

    protected $attributes = [
        'status' => 'unpaid',
    ];

    protected function casts(): array
    {
        return [
            'status' => InvoiceStatus::class,
            'subtotal' => 'integer',
            'discount' => 'integer',
            'service_fee' => 'integer',
            'total' => 'integer',
            'paid_amount' => 'integer',
            'remaining_amount' => 'integer',
            'issued_at' => 'datetime',
            'paid_at' => 'datetime',
            'last_sent_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * Nomor berikutnya, format INV/PBS/YYYY/MM/000123.
     * Panggil di dalam DB::transaction(); unique index `number` tetap menjadi pengaman terakhir.
     */
    public static function nextNumber(): string
    {
        $prefix = 'INV/PBS/'.now(Booking::TIMEZONE)->format('Y/m').'/';

        $last = static::query()
            ->where('number', 'like', $prefix.'%')
            ->orderByDesc('number')
            ->lockForUpdate()
            ->value('number');

        $sequence = $last ? (int) substr($last, strlen($prefix)) + 1 : 1;

        return $prefix.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
    }
}
