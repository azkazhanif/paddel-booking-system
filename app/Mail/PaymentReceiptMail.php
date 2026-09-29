<?php

namespace App\Mail;

use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Bukti pembayaran ke email pemesan: dikirim saat pembayaran (penuh, DP, atau
 * pelunasan) masuk, berisi e-ticket, rincian slot, dan sisa tagihan bila ada.
 */
class PaymentReceiptMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Booking $booking) {}

    public function envelope(): Envelope
    {
        $paid = $this->booking->payment_status === PaymentStatus::Paid;

        return new Envelope(
            subject: $paid
                ? "Pembayaran lunas — booking {$this->booking->code}"
                : "DP diterima — booking {$this->booking->code}",
        );
    }

    public function content(): Content
    {
        $this->booking->loadMissing(['court:id,name', 'items']);

        return new Content(
            view: 'emails.payment-receipt',
            with: [
                'booking' => $this->booking,
                'isPaid' => $this->booking->payment_status === PaymentStatus::Paid,
                'venue' => [
                    'name' => Setting::get('venue.name', 'PBS Padel Club'),
                    'address' => Setting::get('venue.address', ''),
                    'whatsapp' => Setting::get('venue.whatsapp', ''),
                ],
                'actionUrl' => $this->booking->isGuest()
                    ? $this->booking->guestUrl()
                    : route('booking.status', $this->booking->code),
            ],
        );
    }
}
