<?php

namespace App\Http\Controllers\Admin\Setting;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\OperatingHour;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Pengaturan venue (khusus owner): identitas venue, kebijakan booking, DP, tamu,
 * invoice, jam operasional, dan tanggal tutup. Semua nilai dibaca Setting::get()
 * di seluruh aplikasi, jadi perubahan di sini langsung berlaku.
 */
class SettingController extends Controller
{
    public function edit()
    {
        return Inertia::render('Admin/Settings/Edit', [
            'settings' => [
                'venue' => [
                    'name' => Setting::get('venue.name', ''),
                    'address' => Setting::get('venue.address', ''),
                    'whatsapp' => Setting::get('venue.whatsapp', ''),
                    'lat' => Setting::get('venue.coordinates', [])['lat'] ?? null,
                    'lng' => Setting::get('venue.coordinates', [])['lng'] ?? null,
                    'instagram' => Setting::get('venue.socials', [])['instagram'] ?? '',
                    'tiktok' => Setting::get('venue.socials', [])['tiktok'] ?? '',
                ],
                'booking' => [
                    'slot_duration_minutes' => (int) Setting::get('booking.slot_duration_minutes', 60),
                    'max_slots_per_booking' => (int) Setting::get('booking.max_slots_per_booking', 3),
                    'advance_days' => (int) Setting::get('booking.advance_days', 30),
                    'hold_minutes' => (int) Setting::get('booking.hold_minutes', 15),
                    'max_pending_per_user' => (int) Setting::get('booking.max_pending_per_user', 2),
                    'cancel_before_hours' => (int) Setting::get('booking.cancel_before_hours', 24),
                    'service_fee' => (int) Setting::get('booking.service_fee', 0),
                ],
                'guest' => [
                    'enabled' => (bool) Setting::get('guest.enabled', true),
                    'max_bookings_per_ip_hour' => (int) Setting::get('guest.max_bookings_per_ip_hour', 3),
                ],
                'dp' => [
                    'enabled' => (bool) Setting::get('dp.enabled', true),
                    'percentage' => (int) Setting::get('dp.percentage', 30),
                    'min_days_ahead' => (int) Setting::get('dp.min_days_ahead', 1),
                    'settle_before_hours' => (int) Setting::get('dp.settle_before_hours', 3),
                    'no_show_grace_minutes' => (int) Setting::get('dp.no_show_grace_minutes', 15),
                    'max_unsettled_per_user' => (int) Setting::get('dp.max_unsettled_per_user', 2),
                    'refundable_before_hours' => (int) Setting::get('dp.refundable_before_hours', 24),
                ],
                'reminder' => [
                    'play_lead_minutes' => (int) Setting::get('reminder.play_lead_minutes', 60),
                ],
                'invoice' => [
                    'company_name' => Setting::get('invoice.company_name', ''),
                    'tax_id' => Setting::get('invoice.tax_id'),
                    'footer_note' => Setting::get('invoice.footer_note', ''),
                ],
            ],
            'hours' => OperatingHour::query()
                ->orderBy('day_of_week')
                ->get()
                ->map(fn (OperatingHour $hour) => [
                    'day_of_week' => $hour->day_of_week,
                    'open_time' => substr($hour->open_time, 0, 5),
                    'close_time' => substr($hour->close_time, 0, 5),
                    'is_closed' => $hour->is_closed,
                ]),
            'closures' => array_values((array) Setting::get('booking.closures', [])),
            'today' => now(Booking::TIMEZONE)->toDateString(),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'venue.name' => ['required', 'string', 'max:100'],
            'venue.address' => ['nullable', 'string', 'max:255'],
            'venue.whatsapp' => ['nullable', 'string', 'max:20'],
            'venue.lat' => ['nullable', 'numeric', 'between:-90,90'],
            'venue.lng' => ['nullable', 'numeric', 'between:-180,180'],
            'venue.instagram' => ['nullable', 'url', 'max:255'],
            'venue.tiktok' => ['nullable', 'url', 'max:255'],

            'booking.slot_duration_minutes' => ['required', 'integer', 'in:30,60,90'],
            'booking.max_slots_per_booking' => ['required', 'integer', 'between:1,8'],
            'booking.advance_days' => ['required', 'integer', 'between:1,365'],
            'booking.hold_minutes' => ['required', 'integer', 'between:5,120'],
            'booking.max_pending_per_user' => ['required', 'integer', 'between:1,10'],
            'booking.cancel_before_hours' => ['required', 'integer', 'between:0,168'],
            'booking.service_fee' => ['required', 'integer', 'between:0,1000000'],

            'guest.enabled' => ['required', 'boolean'],
            'guest.max_bookings_per_ip_hour' => ['required', 'integer', 'between:1,50'],

            'dp.enabled' => ['required', 'boolean'],
            'dp.percentage' => ['required', 'integer', 'between:5,90'],
            'dp.min_days_ahead' => ['required', 'integer', 'between:0,30'],
            'dp.settle_before_hours' => ['required', 'integer', 'between:0,72'],
            'dp.no_show_grace_minutes' => ['required', 'integer', 'between:0,180'],
            'dp.max_unsettled_per_user' => ['required', 'integer', 'between:1,10'],
            'dp.refundable_before_hours' => ['required', 'integer', 'between:0,168'],

            'reminder.play_lead_minutes' => ['required', 'integer', 'between:15,1440'],

            'invoice.company_name' => ['required', 'string', 'max:100'],
            'invoice.tax_id' => ['nullable', 'string', 'max:30'],
            'invoice.footer_note' => ['nullable', 'string', 'max:255'],

            'hours' => ['required', 'array', 'size:7'],
            'hours.*.day_of_week' => ['required', 'integer', 'between:1,7'],
            'hours.*.open_time' => ['required', 'date_format:H:i'],
            'hours.*.close_time' => ['required', 'date_format:H:i', 'after:hours.*.open_time'],
            'hours.*.is_closed' => ['required', 'boolean'],

            'closures' => ['present', 'array', 'max:60'],
            'closures.*' => ['required', 'date_format:Y-m-d', 'distinct'],
        ]);

        DB::transaction(function () use ($validated) {
            Setting::set('venue.name', $validated['venue']['name']);
            Setting::set('venue.address', $validated['venue']['address'] ?? '');
            Setting::set('venue.whatsapp', $validated['venue']['whatsapp'] ?? '');
            Setting::set('venue.coordinates', [
                'lat' => $validated['venue']['lat'] ?? null,
                'lng' => $validated['venue']['lng'] ?? null,
            ]);
            Setting::set('venue.socials', [
                'instagram' => $validated['venue']['instagram'] ?? '',
                'tiktok' => $validated['venue']['tiktok'] ?? '',
            ]);

            foreach (['booking', 'guest', 'dp', 'reminder', 'invoice'] as $group) {
                foreach ($validated[$group] as $key => $value) {
                    Setting::set("{$group}.{$key}", $value);
                }
            }

            Setting::set('booking.closures', array_values($validated['closures']));

            foreach ($validated['hours'] as $hour) {
                OperatingHour::query()->updateOrCreate(
                    ['day_of_week' => $hour['day_of_week']],
                    [
                        'open_time' => $hour['open_time'].':00',
                        'close_time' => $hour['close_time'].':00',
                        'is_closed' => $hour['is_closed'],
                    ],
                );
            }
        });

        ActivityLog::record('settings.updated', null, ['groups' => ['venue', 'booking', 'guest', 'dp', 'reminder', 'invoice', 'hours', 'closures']]);

        return redirect()->route('admin.settings.edit')->with('success', 'Pengaturan disimpan.');
    }
}
