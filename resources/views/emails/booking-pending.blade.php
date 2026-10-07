@php
    $rupiah = fn ($value) => 'Rp'.number_format((int) $value, 0, ',', '.');
@endphp
<x-mail.pbs :title="'Selesaikan pembayaran — '.$booking->code" eyebrow="Selesaikan pembayaran" :venue="$venue">
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        Halo {{ $booking->customer_name }},<br>
        booking kamu sudah kami simpan dengan kode <strong>{{ $booking->code }}</strong>, tapi slotnya baru terkunci setelah pembayaran masuk.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border-radius:6px;">
        <tr>
            <td style="padding:16px 20px;color:#b45309;font-size:14px;">
                Bayar sebelum <strong>{{ $deadline }} WIB</strong>. Lewat dari itu slot otomatis dilepas dan bisa diambil orang lain.
            </td>
        </tr>
    </table>

    @include('emails.partials.booking-details', ['booking' => $booking])

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;font-size:14px;">
        <tr>
            <td style="padding:10px 0 0;font-weight:700;border-top:1px solid #e3e7de;">Total tagihan</td>
            <td style="padding:10px 0 0;text-align:right;font-weight:700;border-top:1px solid #e3e7de;">{{ $rupiah($booking->total) }}</td>
        </tr>
    </table>

    <p style="margin:24px 0 0;text-align:center;">
        <a href="{{ $actionUrl }}" style="display:inline-block;background:#1ed760;color:#050605;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:999px;">
            Bayar sekarang
        </a>
    </p>

    <p style="margin:16px 0 0;font-size:12px;color:#5b615a;text-align:center;">
        Tombol tidak bisa diklik? Salin tautan ini: <br>{{ $actionUrl }}
    </p>
</x-mail.pbs>
