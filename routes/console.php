<?php

use App\Models\Booking;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// BR-05: booking pending yang lewat batas bayar dilepas slotnya tiap menit.
Schedule::call(fn () => Booking::expireStale())->everyMinute()->name('bookings:expire')->withoutOverlapping();

// Pengingat WhatsApp ~1 jam sebelum jam main (lead-time diatur di pengaturan).
Schedule::command('bookings:remind-play')->everyFiveMinutes()->name('bookings:remind-play')->withoutOverlapping();
