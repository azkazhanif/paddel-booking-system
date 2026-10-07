<?php

namespace App\Http\Controllers\Home;

use App\Enums\PriceLabel;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Faq;
use App\Models\OperatingHour;
use App\Models\PriceRule;
use App\Models\Setting;
use App\Models\Testimonial;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        $today = now(Booking::TIMEZONE);

        $courts = Court::query()
            ->active()
            ->with('coverImage')
            ->withMin(['priceRules as min_rule_price' => fn ($query) => $query->where('is_active', true)], 'price')
            ->orderBy('sort_order')
            ->get()
            ->map(function (Court $court) use ($today) {
                $slots = collect($court->slotsOn($today));
                $available = $slots->where('status', 'available');

                return [
                    'id' => $court->id,
                    'name' => $court->name,
                    'slug' => $court->slug,
                    'type' => $court->type->value,
                    'surface' => $court->surface,
                    'description' => $court->description,
                    'facilities' => $court->facilities ?? [],
                    'price_from' => min(array_filter([$court->base_price, $court->min_rule_price])),
                    'image' => $court->coverImage ? Storage::url($court->coverImage->path) : null,
                    'today' => [
                        'available' => $available->count(),
                        'total' => $slots->count(),
                        'next' => $available->first() ? substr($available->first()['start_time'], 0, 5) : null,
                    ],
                ];
            });

        $rulePrices = PriceRule::query()
            ->where('is_active', true)
            ->whereHas('court', fn ($query) => $query->active())
            ->selectRaw('label, MIN(price) as price')
            ->groupBy('label')
            ->pluck('price', 'label');

        $basePrice = (int) Court::query()->active()->min('base_price');

        $hours = OperatingHour::query()->where('is_closed', false)->get(['open_time', 'close_time']);

        return Inertia::render('Home', [
            'canRegister' => Route::has('register'),
            'venue' => Setting::venue(),
            'hero' => Setting::get('home.hero', ['headline' => 'Own The Court.', 'subheadline' => '']),
            'courts' => $courts,
            'pricing' => [
                'off_peak' => (int) ($rulePrices[PriceLabel::OffPeak->value] ?? $basePrice),
                'peak' => (int) ($rulePrices[PriceLabel::Peak->value] ?? $basePrice),
                'weekend' => (int) ($rulePrices[PriceLabel::Weekend->value] ?? $basePrice),
            ],
            'stats' => [
                'courts' => $courts->count(),
                'available_today' => $courts->sum('today.available'),
                'open_time' => $hours->min('open_time') ? substr($hours->min('open_time'), 0, 5) : null,
                'close_time' => $hours->max('close_time') ? substr($hours->max('close_time'), 0, 5) : null,
                'slot_minutes' => (int) Setting::get('booking.slot_duration_minutes', 60),
                'rating' => round((float) Testimonial::query()->where('is_published', true)->avg('rating'), 1),
                'reviews' => Testimonial::query()->where('is_published', true)->count(),
            ],
            'dpPercentage' => (int) Setting::get('dp.percentage', 30),
            'faqs' => Faq::query()->published()->where('show_on_home', true)->get(['id', 'question', 'answer']),
            'testimonials' => Testimonial::query()->published()->get(['id', 'name', 'role', 'content', 'rating']),
        ]);
    }
}
