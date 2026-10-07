<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'venue.name' => 'PBS Padel Club',
            'venue.address' => 'Jl. Contoh Raya No. 1, Jakarta',
            'venue.coordinates' => ['lat' => null, 'lng' => null],
            'venue.whatsapp' => '6281200000000',
            'venue.socials' => ['instagram' => 'https://instagram.com/', 'tiktok' => 'https://tiktok.com/'],
            'booking.slot_duration_minutes' => 60,
            'booking.max_slots_per_booking' => 3,
            'booking.advance_days' => 90,
            'booking.hold_minutes' => 15,
            'booking.max_pending_per_user' => 2,
            'booking.cancel_before_hours' => 24,
            'booking.service_fee' => 0,
            'booking.closures' => [],
            'guest.enabled' => true,
            'guest.max_bookings_per_ip_hour' => 3,
            'dp.enabled' => true,
            'dp.percentage' => 30,
            'dp.min_days_ahead' => 1,
            'dp.settle_before_hours' => 3,
            'dp.remind_h1_hours' => 24,
            'dp.remind_last_hours' => 6,
            'dp.no_show_grace_minutes' => 15,
            'dp.max_unsettled_per_user' => 2,
            'dp.no_show_window_days' => 90,
            'dp.no_show_limit' => 2,
            'dp.suspend_days' => 30,
            'dp.refundable_before_hours' => 24,
            'reminder.play_lead_minutes' => 60,
            'invoice.company_name' => 'PBS Padel Club',
            'invoice.tax_id' => null,
            'invoice.footer_note' => 'Terima kasih telah bermain di PBS.',
            'home.hero' => [
                'headline' => 'Own The Court.',
                'subheadline' => 'Cek jadwal kosong secara real-time, pilih jam favoritmu, dan bayar langsung lewat QRIS, e-wallet, atau virtual account.',
            ],
        ];

        foreach ($defaults as $key => $value) {
            Setting::query()->firstOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
