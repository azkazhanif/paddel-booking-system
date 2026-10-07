<?php

namespace App\Console\Commands;

use App\Enums\ReminderType;
use App\Models\Booking;
use App\Models\Setting;
use Illuminate\Console\Command;

/**
 * BR-DP4: pengingat pelunasan DP — H-1 sebelum batas pelunasan, lalu sekali lagi
 * enam jam sebelum batas. Pengingat yang sudah terkirim tidak diulang.
 */
class SendSettlementRemindersCommand extends Command
{
    protected $signature = 'bookings:remind-settlement';

    protected $description = 'Kirim pengingat pelunasan DP ke member yang belum melunasi';

    public function handle(): int
    {
        // Enum tidak bisa menjadi kunci array, jadi tahapannya disimpan sebagai pasangan.
        $stages = [
            [ReminderType::SettlementH1, (int) Setting::get('dp.remind_h1_hours', 24)],
            [ReminderType::Settlement6h, (int) Setting::get('dp.remind_last_hours', 6)],
        ];

        $sent = 0;

        foreach ($stages as [$type, $hours]) {
            foreach (Booking::dueForSettlementReminder($hours, $type) as $booking) {
                if ($booking->sendSettlementReminder($type)) {
                    $sent++;
                    $this->line("Pengingat {$type->value}: {$booking->code} → {$booking->customer_email}");
                }
            }
        }

        $this->info("{$sent} pengingat pelunasan dikirim.");

        return self::SUCCESS;
    }
}
