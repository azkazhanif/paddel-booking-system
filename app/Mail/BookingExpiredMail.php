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
 * Pemberitahuan bahwa booking kedaluwarsa karena tidak dibayar sampai batas waktu,
 * beserta ajakan memesan ulang.
 */
class BookingExpiredMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Booking $booking) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Booking {$this->booking->code} kedaluwarsa");
    }

    public function content(): Content
    {
        $this->booking->loadMissing('court:id,name');

        return new Content(
            view: 'emails.booking-expired',
            with: [
                'booking' => $this->booking,
                'venue' => [
                    'name' => Setting::get('venue.name', 'PBS Padel Club'),
                    'address' => Setting::get('venue.address', ''),
                    'whatsapp' => Setting::get('venue.whatsapp', ''),
                ],
                'actionUrl' => route('booking.create', ['date' => $this->booking->date->toDateString()]),
            ],
        );
    }
}
