<x-mail.pbs :title="'Booking kedaluwarsa — '.$booking->code" eyebrow="Booking kedaluwarsa" :venue="$venue">
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        Halo {{ $booking->customer_name }},<br>
        booking <strong>{{ $booking->code }}</strong> kedaluwarsa karena pembayarannya tidak masuk sampai batas waktu, jadi slotnya kami lepas lagi.
    </p>

    @include('emails.partials.booking-details', ['booking' => $booking])

    <p style="margin:24px 0 0;text-align:center;">
        <a href="{{ $actionUrl }}" style="display:inline-block;background:#1ed760;color:#050605;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:999px;">
            Booking ulang
        </a>
    </p>

    <p style="margin:16px 0 0;font-size:13px;color:#5b615a;">
        Kalau slot itu sudah diambil orang lain, masih banyak jam lain yang kosong di tanggal yang sama.
    </p>
</x-mail.pbs>
