<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingItem extends Model
{
    protected $fillable = [
        'booking_id',
        'court_id',
        'date',
        'start_time',
        'end_time',
        'price',
        'price_label',
        'is_active',
    ];

    protected $attributes = [
        'is_active' => true,
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'price' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }

    public function scopeActiveOn(Builder $query, int $courtId, string $date): void
    {
        $query->where('court_id', $courtId)
            ->whereDate('date', $date)
            ->where('is_active', true);
    }
}
