<?php

namespace App\Http\Controllers\Booking;

use App\Http\Controllers\Controller;
use App\Mail\BookingLinkMail;
use App\Models\Booking;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

/**
 * Cek booking untuk tamu yang kehilangan link dari email. Detail booking tidak
 * pernah ditampilkan langsung — link akses dikirim ulang ke email terdaftar,
 * supaya kode booking orang lain tidak bisa ditebak.
 */
class BookingLookupController extends Controller
{
    public function show()
    {
        return Inertia::render('Booking/Lookup', [
            'venue' => Setting::venue(),
            'status' => session('status'),
        ]);
    }

    public function send(Request $request)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:12'],
            'email' => ['required', 'email', 'max:255'],
        ]);

        $booking = Booking::query()
            ->with('court:id,name')
            ->where('code', strtoupper(trim($validated['code'])))
            ->forEmail($validated['email'])
            ->first();

        if ($booking) {
            Mail::to($booking->customer_email)->queue(new BookingLinkMail($booking));
        }

        // Jawaban selalu sama, baik bookingnya ketemu maupun tidak (anti enumerasi).
        return back()->with('status', 'Kalau kombinasi kode dan email itu cocok, link aksesnya sudah kami kirim ke email tersebut.');
    }
}
