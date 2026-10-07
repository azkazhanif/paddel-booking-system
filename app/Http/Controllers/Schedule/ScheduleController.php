<?php

namespace App\Http\Controllers\Schedule;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Setting;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/**
 * Jadwal semua lapangan dalam satu tanggal, supaya pengunjung bisa membandingkan
 * jam kosong antar lapangan sebelum masuk ke form booking.
 */
class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        Booking::expireStale();

        $filters = $request->validate(['date' => ['nullable', 'date_format:Y-m-d']]);

        $today = CarbonImmutable::parse(now(Booking::TIMEZONE)->toDateString(), Booking::TIMEZONE);
        $advanceDays = (int) Setting::get('booking.advance_days', 90);
        $date = CarbonImmutable::parse($filters['date'] ?? $today->toDateString(), Booking::TIMEZONE);
        $date = $date->lt($today) || $date->gt($today->addDays($advanceDays)) ? $today : $date;

        $courts = Court::query()->active()->with(['coverImage', 'priceRules'])->orderBy('sort_order')->get();

        return Inertia::render('Schedule/Index', [
            'venue' => Setting::venue(),
            'selected' => ['date' => $date->toDateString()],
            'today' => $today->toDateString(),
            'advanceDays' => $advanceDays,
            'slotMinutes' => (int) Setting::get('booking.slot_duration_minutes', 60),
            'schedule' => fn () => $courts->map(fn (Court $court) => [
                'id' => $court->id,
                'name' => $court->name,
                'slug' => $court->slug,
                'type' => $court->type->value,
                'image' => $court->coverImage ? Storage::url($court->coverImage->path) : null,
                'slots' => $court->availabilityOn($date),
            ])->values(),
        ]);
    }
}
