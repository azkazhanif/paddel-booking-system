<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Models\Setting;
use Illuminate\Console\Command;

/**
 * Pengingat WhatsApp menjelang jam main (default 1 jam sebelum). Dijalankan scheduler
 * tiap lima menit; booking yang sudah pernah diingatkan dilewati.
 */
class SendPlayRemindersCommand extends Command
{
    protected $signature = 'bookings:remind-play {--minutes= : Menit sebelum jam main (default dari pengaturan)}';

    protected $description = 'Kirim pengingat WhatsApp ke customer menjelang jam main';

    public function handle(): int
    {
        $minutes = (int) ($this->option('minutes') ?? Setting::get('reminder.play_lead_minutes', 60));
        $bookings = Booking::dueForPlayReminder($minutes);
        $sent = 0;

        foreach ($bookings as $booking) {
            if ($booking->sendPlayReminder()) {
                $sent++;
                $this->line("Pengingat terkirim: {$booking->code} → {$booking->customer_phone}");
            }
        }

        $this->info("{$sent} pengingat dikirim dari {$bookings->count()} booking yang akan dimulai dalam {$minutes} menit.");

        return self::SUCCESS;
    }
}
