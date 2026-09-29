<?php

namespace App\Models;

use App\Enums\CourtType;
use App\Enums\PriceLabel;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Court extends Model
{
    use HasFactory, SoftDeletes;

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
     * Daftar slot pada tanggal tertentu beserta statusnya: available, booked, blocked, atau past.
     *
     * @return list<array{start_time: string, end_time: string, status: string}>
     */
    public function slotsOn(CarbonInterface $date): array
    {
        $date = CarbonImmutable::parse($date->toDateString(), Booking::TIMEZONE);
        $hours = OperatingHour::query()->where('day_of_week', $date->isoWeekday())->first();

        if (! $hours || $hours->is_closed || in_array($date->toDateString(), Setting::get('booking.closures', []), true)) {
            return [];
        }

        $duration = (int) Setting::get('booking.slot_duration_minutes', 60);
        $now = now(Booking::TIMEZONE);

        $booked = $this->bookingItems()
            ->whereDate('date', $date->toDateString())
            ->where('is_active', true)
            ->pluck('start_time')
            ->map(fn (string $time) => date('H:i:s', strtotime($time)))
            ->all();

        $blocks = $this->slotBlocks()->whereDate('date', $date->toDateString())->get(['start_time', 'end_time']);

        $slots = [];
        $start = $date->setTimeFromTimeString($hours->open_time);
        $close = $date->setTimeFromTimeString($hours->close_time);

        while ($start->addMinutes($duration)->lte($close)) {
            $end = $start->addMinutes($duration);
            $startTime = $start->format('H:i:s');

            $status = match (true) {
                $start->lte($now) => 'past',
                in_array($startTime, $booked, true) => 'booked',
                $blocks->contains(fn (SlotBlock $block) => $block->start_time <= $startTime && $block->end_time > $startTime) => 'blocked',
                default => 'available',
            };

            $slots[] = ['start_time' => $startTime, 'end_time' => $end->format('H:i:s'), 'status' => $status];
            $start = $end;
        }

        return $slots;
    }

    /**
     * Slot pada tanggal tertentu lengkap dengan harga server (dipakai halaman booking publik & walk-in).
     *
     * @return list<array<string, mixed>>
     */
    public function availabilityOn(CarbonInterface $date): array
    {
        return array_map(fn (array $slot) => [
            ...$slot,
            'price' => $this->priceAt($date, $slot['start_time']),
            'price_label' => $this->priceLabelAt($date, $slot['start_time'])?->value,
        ], $this->slotsOn($date));
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
