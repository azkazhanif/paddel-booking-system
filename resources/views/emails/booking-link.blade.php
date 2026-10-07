<x-mail.pbs :title="'Link booking '.$booking->code" eyebrow="Link booking" :venue="$venue">
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        Halo {{ $booking->customer_name }},<br>
        ini link untuk membuka booking <strong>{{ $booking->code }}</strong> — berisi status pembayaran, e-ticket, dan invoice.
    </p>

    @include('emails.partials.booking-details', ['booking' => $booking])

    <p style="margin:24px 0 0;text-align:center;">
        <a href="{{ $actionUrl }}" style="display:inline-block;background:#1ed760;color:#050605;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:999px;">
            Buka booking
        </a>
    </p>

    <p style="margin:16px 0 0;font-size:12px;color:#5b615a;text-align:center;">
        Tidak meminta link ini? Abaikan saja email ini — tidak ada perubahan pada bookingmu.
    </p>
</x-mail.pbs>
