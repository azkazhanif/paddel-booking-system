<?php

namespace App\Models;

use App\Enums\ReminderChannel;
use App\Enums\ReminderType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentReminder extends Model
{
    protected $fillable = [
        'booking_id',
        'type',
        'channel',
        'sent_at',
    ];

    protected $attributes = [
        'channel' => 'email',
    ];

    protected function casts(): array
    {
        return [
            'type' => ReminderType::class,
            'channel' => ReminderChannel::class,
            'sent_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
