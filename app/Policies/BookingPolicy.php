<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\User;

/**
 * Akses booking publik: pemilik akun, staff/admin, atau tamu yang kode bookingnya
 * tercatat di sesinya (dari proses booking atau dari link signed di email).
 */
class BookingPolicy
{
    public const SESSION_KEY = 'booking.codes';

    public function view(?User $user, Booking $booking): bool
    {
        if ($user && ($booking->user_id === $user->id || $user->canAccessAdmin() || $user->isStaff())) {
            return true;
        }

        // Booking milik member hanya bisa dibuka lewat akunnya; kode di sesi hanya
        // berlaku untuk booking tamu (dari proses booking atau link signed).
        return $booking->isGuest() && in_array($booking->code, (array) session(self::SESSION_KEY, []), true);
    }

    public function pay(?User $user, Booking $booking): bool
    {
        return $this->view($user, $booking);
    }

    /**
     * Catat kode booking di sesi agar tamu tetap bisa membuka checkout & status
     * tanpa akun (dan tanpa kode booking bisa ditebak orang lain).
     */
    public static function grantSessionAccess(Booking $booking): void
    {
        $codes = array_values(array_unique([...(array) session(self::SESSION_KEY, []), $booking->code]));

        session([self::SESSION_KEY => array_slice($codes, -20)]);
    }
}
