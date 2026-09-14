<?php

namespace App\Models;

use App\Enums\CourtType;
use App\Enums\PriceLabel;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Court extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'type',
        'surface',
        'description',
        'facilities',
        'rules',
        'base_price',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'type' => CourtType::class,
            'facilities' => 'array',
            'base_price' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function images(): HasMany
    {
        return $this->hasMany(CourtImage::class)->orderBy('sort_order');
    }

    public function coverImage(): HasOne
    {
        return $this->hasOne(CourtImage::class)->oldestOfMany('sort_order');
    }

    public function priceRules(): HasMany
    {
        return $this->hasMany(PriceRule::class);
    }

    public function specialPrices(): HasMany
    {
        return $this->hasMany(SpecialPrice::class);
    }

    public function slotBlocks(): HasMany
    {
        return $this->hasMany(SlotBlock::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function bookingItems(): HasMany
    {
        return $this->hasMany(BookingItem::class);
    }

    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }

    /**
     * Harga satu slot (BR-07): special price court ini > special price semua court > price rule > base price.
     */
    public function priceAt(CarbonInterface $date, string $startTime): int
    {
        return $this->resolvePrice($date, $startTime)['price'];
    }

    public function priceLabelAt(CarbonInterface $date, string $startTime): ?PriceLabel
    {
        return $this->resolvePrice($date, $startTime)['label'];
    }

    /**
     * @return array{price: int, label: PriceLabel|null}
     */
    protected function resolvePrice(CarbonInterface $date, string $startTime): array
    {
        $time = date('H:i:s', strtotime($startTime));

        $special = SpecialPrice::query()
            ->whereDate('date', $date->toDateString())
            ->where(fn (Builder $query) => $query->where('court_id', $this->id)->orWhereNull('court_id'))
            ->where(fn (Builder $query) => $query
                ->whereNull('start_time')
                ->orWhere(fn (Builder $query) => $query->where('start_time', '<=', $time)->where('end_time', '>', $time)))
            ->orderByRaw('court_id IS NULL')
            ->first();

        if ($special) {
            return ['price' => $special->price, 'label' => PriceLabel::Custom];
        }

        $rules = $this->relationLoaded('priceRules')
            ? $this->priceRules->where('is_active', true)
            : $this->priceRules()->where('is_active', true)->get();

        $rule = $rules->first(fn (PriceRule $rule) => $rule->appliesTo($date, $time));

        if ($rule) {
            return ['price' => $rule->price, 'label' => $rule->label];
        }

        return ['price' => $this->base_price, 'label' => null];
    }
}
