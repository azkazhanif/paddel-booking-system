<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourtImage extends Model
{
    protected $fillable = [
        'court_id',
        'path',
        'alt',
        'sort_order',
    ];

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }
}
