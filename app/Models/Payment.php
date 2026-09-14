<?php

namespace App\Models;

use App\Enums\PaymentProvider;
use App\Enums\PaymentType;
use App\Enums\TransactionStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
}
