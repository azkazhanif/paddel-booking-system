<?php

namespace App\Http\Controllers\Page;

use App\Enums\PriceLabel;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Faq;
use App\Models\OperatingHour;
use App\Models\PriceRule;
use App\Models\Setting;
use App\Models\SpecialPrice;
use App\Models\Testimonial;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/**
 * Halaman statis & informasi: harga, tentang, kontak, FAQ, legal, dan keuntungan member.
 * Isinya mengikuti pengaturan venue supaya tidak pernah bertentangan dengan aturan sistem.
 */
class PageController extends Controller
{
    public function pricing()
    {
        $courts = Court::query()
            ->active()
            ->with(['priceRules' => fn ($query) => $query->where('is_active', true)->orderBy('start_time')])
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Court $court) => [
                'name' => $court->name,
                'slug' => $court->slug,
                'type' => $court->type->value,
                'base_price' => $court->base_price,
                'rules' => $court->priceRules->map(fn (PriceRule $rule) => [
                    'label' => $rule->label->value,
                    'days_of_week' => array_map('intval', $rule->days_of_week),
                    'start_time' => $rule->start_time,
                    'end_time' => $rule->end_time,
                    'price' => $rule->price,
                ])->values(),
            ])
            ->values();

        $today = now(Booking::TIMEZONE)->toDateString();

        return Inertia::render('Pricing', [
            'venue' => Setting::venue(),
            'courts' => $courts,
            'labels' => $this->priceLabels(),
            'specialPrices' => SpecialPrice::query()
                ->with('court:id,name')
                ->whereDate('date', '>=', $today)
                ->orderBy('date')
                ->limit(12)
                ->get()
                ->map(fn (SpecialPrice $special) => [
                    'date' => $special->date->toDateString(),
                    'court' => $special->court?->name,
                    'start_time' => $special->start_time,
                    'end_time' => $special->end_time,
                    'price' => $special->price,
                    'note' => $special->note,
                ])
                ->values(),
            'policy' => $this->policy(),
            'faqs' => Faq::query()->published()->get(['id', 'question', 'answer']),
        ]);
    }

    public function about()
    {
        return Inertia::render('About', [
            'venue' => Setting::venue(),
            'hours' => $this->hours(),
            'stats' => [
                'courts' => Court::query()->active()->count(),
                'rating' => round((float) Testimonial::query()->where('is_published', true)->avg('rating'), 1),
                'reviews' => Testimonial::query()->where('is_published', true)->count(),
                'slot_minutes' => (int) Setting::get('booking.slot_duration_minutes', 60),
            ],
            'testimonials' => Testimonial::query()->published()->get(['id', 'name', 'role', 'content', 'rating']),
        ]);
    }

    public function contact()
    {
        return Inertia::render('Contact', [
            'venue' => Setting::venue(),
            'hours' => $this->hours(),
        ]);
    }

    public function faq()
    {
        return Inertia::render('Faq', [
            'venue' => Setting::venue(),
            'faqs' => Faq::query()->published()->get(['id', 'question', 'answer']),
            'policy' => $this->policy(),
        ]);
    }

    public function terms()
    {
        return Inertia::render('Legal/Terms', [
            'venue' => Setting::venue(),
            'policy' => $this->policy(),
            'updatedAt' => Setting::get('legal.updated_at', now()->toDateString()),
        ]);
    }

    public function privacy()
    {
        return Inertia::render('Legal/Privacy', [
            'venue' => Setting::venue(),
            'updatedAt' => Setting::get('legal.updated_at', now()->toDateString()),
        ]);
    }

    public function membership()
    {
        return Inertia::render('Membership', [
            'venue' => Setting::venue(),
            'canRegister' => Route::has('register'),
            'policy' => $this->policy(),
        ]);
    }

    /**
     * Angka kebijakan yang dipakai di halaman informasi — selalu dari pengaturan.
     *
     * @return array<string, mixed>
     */
    protected function policy(): array
    {
        return [
            'dp_enabled' => (bool) Setting::get('dp.enabled', true),
            'dp_percentage' => (int) Setting::get('dp.percentage', 30),
            'dp_min_days_ahead' => (int) Setting::get('dp.min_days_ahead', 1),
            'dp_settle_before_hours' => (int) Setting::get('dp.settle_before_hours', 3),
            'dp_refundable_before_hours' => (int) Setting::get('dp.refundable_before_hours', 24),
            'dp_no_show_grace_minutes' => (int) Setting::get('dp.no_show_grace_minutes', 15),
            'hold_minutes' => (int) Setting::get('booking.hold_minutes', 15),
            'cancel_before_hours' => (int) Setting::get('booking.cancel_before_hours', 24),
            'advance_days' => (int) Setting::get('booking.advance_days', 90),
            'max_slots' => (int) Setting::get('booking.max_slots_per_booking', 3),
            'slot_minutes' => (int) Setting::get('booking.slot_duration_minutes', 60),
            'service_fee' => (int) Setting::get('booking.service_fee', 0),
            'guest_enabled' => (bool) Setting::get('guest.enabled', true),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function hours(): array
    {
        return OperatingHour::query()
            ->orderBy('day_of_week')
            ->get()
            ->map(fn (OperatingHour $hour) => [
                'day_of_week' => $hour->day_of_week,
                'open_time' => substr($hour->open_time, 0, 5),
                'close_time' => substr($hour->close_time, 0, 5),
                'is_closed' => $hour->is_closed,
            ])
            ->all();
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    protected function priceLabels(): array
    {
        return array_map(fn (PriceLabel $label) => [
            'value' => $label->value,
            'label' => match ($label) {
                PriceLabel::OffPeak => 'Off-peak',
                PriceLabel::Peak => 'Peak',
                PriceLabel::Weekend => 'Weekend',
                PriceLabel::Custom => 'Khusus',
            },
        ], PriceLabel::cases());
    }
}
