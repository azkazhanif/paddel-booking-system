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
 * Kirim ulang link akses booking dari halaman "Cek booking".
 */
class BookingLinkMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Booking $booking) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Link booking {$this->booking->code}");
    }

    public function content(): Content
    {
        $this->booking->loadMissing('court:id,name');

        return new Content(
            view: 'emails.booking-link',
            with: [
                'booking' => $this->booking,
                'venue' => Setting::venue(),
                'actionUrl' => $this->booking->isGuest()
                    ? $this->booking->guestUrl()
                    : route('my-bookings.show', $this->booking->code),
            ],
        );
    }
}
