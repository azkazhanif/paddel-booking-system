<?php

namespace App\Models;

use App\Enums\BlockReason;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SlotBlock extends Model
{
    protected $fillable = [
        'court_id',
        'date',
        'start_time',
        'end_time',
        'reason',
        'note',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'reason' => BlockReason::class,
        ];
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
