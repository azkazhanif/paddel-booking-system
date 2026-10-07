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
 * BR-DP4: pengingat melunasi sisa tagihan sebelum batas pelunasan.
 */
class SettlementReminderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Booking $booking) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Lunasi sisa tagihan booking {$this->booking->code}");
    }

    public function content(): Content
    {
        $this->booking->loadMissing('court:id,name');

        return new Content(
            view: 'emails.settlement-reminder',
            with: [
                'booking' => $this->booking,
                'venue' => [
                    'name' => Setting::get('venue.name', 'PBS Padel Club'),
                    'address' => Setting::get('venue.address', ''),
                    'whatsapp' => Setting::get('venue.whatsapp', ''),
                ],
                'deadline' => $this->booking->settlement_due_at
                    ?->timezone(Booking::TIMEZONE)
                    ->locale('id')
                    ->translatedFormat('l, j F Y H:i'),
                'actionUrl' => $this->booking->isGuest()
                    ? $this->booking->guestUrl()
                    : route('my-bookings.show', $this->booking->code),
            ],
        );
    }
}
