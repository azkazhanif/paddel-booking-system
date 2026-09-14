<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpecialPrice extends Model
{
    protected $fillable = [
        'court_id',
        'date',
        'start_time',
        'end_time',
        'price',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'price' => 'integer',
        ];
    }

    /**
     * Null = berlaku untuk semua lapangan.
     */
    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }
}
