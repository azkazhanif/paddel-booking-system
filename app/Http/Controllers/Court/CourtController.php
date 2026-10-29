<?php

namespace App\Http\Controllers\Court;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\CourtImage;
use App\Models\PriceRule;
use App\Models\Setting;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/**
 * Daftar & detail lapangan untuk pengunjung. Lapangan nonaktif tidak tampil (BR-12).
 */
class CourtController extends Controller
{
    public function index()
    {
        Booking::expireStale();

        $today = CarbonImmutable::parse(now(Booking::TIMEZONE)->toDateString(), Booking::TIMEZONE);

        $courts = Court::query()
            ->active()
            ->with(['coverImage', 'priceRules'])
            ->orderBy('sort_order')
            ->get()
            ->map(function (Court $court) use ($today) {
                $slots = collect($court->slotsOn($today));

                return [
                    'id' => $court->id,
                    'name' => $court->name,
                    'slug' => $court->slug,
                    'type' => $court->type->value,
                    'surface' => $court->surface,
                    'description' => $court->description,
                    'facilities' => $court->facilities ?? [],
                    'image' => $court->coverImage ? Storage::disk('public')->url($court->coverImage->path) : null,
                    'price_from' => $this->priceFrom($court),
                    'today' => [
                        'available' => $slots->where('status', 'available')->count(),
                        'total' => $slots->count(),
                        'next' => $slots->firstWhere('status', 'available')['start_time'] ?? null,
                    ],
                ];
            })
            ->values();

        return Inertia::render('Courts/Index', [
            'venue' => Setting::venue(),
            'courts' => $courts,
            'slotMinutes' => (int) Setting::get('booking.slot_duration_minutes', 60),
            'dpPercentage' => (int) Setting::get('dp.percentage', 30),
        ]);
    }

    public function show(Request $request, Court $court)
    {
        abort_unless($court->is_active, 404);

        Booking::expireStale();

        $filters = $request->validate(['date' => ['nullable', 'date_format:Y-m-d']]);

        $today = CarbonImmutable::parse(now(Booking::TIMEZONE)->toDateString(), Booking::TIMEZONE);
        $advanceDays = (int) Setting::get('booking.advance_days', 90);
        $date = CarbonImmutable::parse($filters['date'] ?? $today->toDateString(), Booking::TIMEZONE);
        $date = $date->lt($today) || $date->gt($today->addDays($advanceDays)) ? $today : $date;

        $court->load(['images', 'priceRules' => fn ($query) => $query->where('is_active', true)->orderBy('start_time')]);

        return Inertia::render('Courts/Show', [
            'venue' => Setting::venue(),
            'court' => [
                ...$court->only(['id', 'name', 'slug', 'surface', 'description', 'rules', 'base_price']),
                'type' => $court->type->value,
                'facilities' => $court->facilities ?? [],
                'images' => $court->images->map(fn (CourtImage $image) => [
                    'id' => $image->id,
                    'url' => Storage::disk('public')->url($image->path),
                    'alt' => $image->alt ?? $court->name,
                ])->values(),
                'price_from' => $this->priceFrom($court),
            ],
            'rules' => $court->priceRules->map(fn (PriceRule $rule) => [
                'label' => $rule->label->value,
                'days_of_week' => array_map('intval', $rule->days_of_week),
                'start_time' => $rule->start_time,
                'end_time' => $rule->end_time,
                'price' => $rule->price,
            ])->values(),
            'selected' => ['date' => $date->toDateString()],
            'availability' => fn () => $court->availabilityOn($date),
            'others' => Court::query()
                ->active()
                ->whereKeyNot($court->id)
                ->with('coverImage')
                ->orderBy('sort_order')
                ->get()
                ->map(fn (Court $other) => [
                    'name' => $other->name,
                    'slug' => $other->slug,
                    'type' => $other->type->value,
                    'image' => $other->coverImage ? Storage::disk('public')->url($other->coverImage->path) : null,
                ])
                ->values(),
            'today' => $today->toDateString(),
            'advanceDays' => $advanceDays,
            'slotMinutes' => (int) Setting::get('booking.slot_duration_minutes', 60),
        ]);
    }

    /**
     * Harga termurah lapangan: harga dasar dibanding aturan harga yang aktif.
     */
    protected function priceFrom(Court $court): int
    {
        $rulePrices = $court->priceRules->where('is_active', true)->pluck('price')->all();

        return (int) min([$court->base_price, ...$rulePrices]);
    }
}
