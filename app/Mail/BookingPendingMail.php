<?php

namespace App\Mail;

use App\Models\Booking;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * BR-G3: email "Selesaikan Pembayaran" berisi ringkasan booking, batas waktu bayar,
 * dan link pembayaran — sehingga pemesan tetap bisa membayar walau tabnya tertutup.
 */
class BookingPendingMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Booking $booking) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Selesaikan pembayaran booking {$this->booking->code}");
    }

    public function content(): Content
    {
        $this->booking->loadMissing(['court:id,name', 'items']);

        return new Content(
            view: 'emails.booking-pending',
            with: [
                'booking' => $this->booking,
                'venue' => [
                    'name' => Setting::get('venue.name', 'PBS Padel Club'),
                    'address' => Setting::get('venue.address', ''),
                    'whatsapp' => Setting::get('venue.whatsapp', ''),
                ],
                'deadline' => $this->booking->expires_at
                    ?->timezone(Booking::TIMEZONE)
                    ->locale('id')
                    ->translatedFormat('j F Y H:i'),
                // Tamu memakai link signed karena tidak punya akun untuk login.
                'actionUrl' => $this->booking->isGuest()
                    ? $this->booking->guestUrl()
                    : route('booking.checkout', $this->booking->code),
            ],
        );
    }
}
