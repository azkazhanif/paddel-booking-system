<?php

namespace App\Models;

use App\Enums\PriceLabel;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriceRule extends Model
{
    protected $fillable = [
        'court_id',
        'label',
        'days_of_week',
        'start_time',
        'end_time',
        'price',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'label' => PriceLabel::class,
            'days_of_week' => 'array',
            'price' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }

    /**
     * Rentang jam: start_time inklusif, end_time eksklusif. $time berformat H:i:s.
     */
    public function appliesTo(CarbonInterface $date, string $time): bool
    {
        return in_array($date->isoWeekday(), array_map('intval', $this->days_of_week), true)
            && $this->start_time <= $time
            && $this->end_time > $time;
    }
}
