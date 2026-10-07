<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Models\Setting;
use Illuminate\Console\Command;

/**
 * Menutup booking yang jam mainnya sudah lewat: yang lunas menjadi selesai, dan
 * yang DP-nya tidak dilunasi serta pemainnya tidak datang menjadi no-show (BR-DP6).
 */
class CloseBookingsCommand extends Command
{
    protected $signature = 'bookings:close {--grace= : Menit toleransi setelah jam mulai (default dari pengaturan)}';

    protected $description = 'Tandai booking lewat jam main sebagai selesai atau no-show';

    public function handle(): int
    {
        $grace = (int) ($this->option('grace') ?? Setting::get('dp.no_show_grace_minutes', 15));

        $noShows = Booking::dueForNoShow($grace);

        foreach ($noShows as $booking) {
            $booking->markNoShow();
            $this->line("No-show: {$booking->code} (DP hangus)");
        }

        $completed = Booking::dueForCompletion();

        foreach ($completed as $booking) {
            $booking->markCompleted();
            $this->line("Selesai: {$booking->code}");
        }

        $this->info("{$noShows->count()} no-show dan {$completed->count()} booking selesai ditandai.");

        return self::SUCCESS;
    }
}
