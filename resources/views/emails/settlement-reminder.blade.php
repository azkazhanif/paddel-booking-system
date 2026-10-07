@php
    $rupiah = fn ($value) => 'Rp'.number_format((int) $value, 0, ',', '.');
@endphp
<x-mail.pbs :title="'Lunasi sisa tagihan — '.$booking->code" eyebrow="Pengingat pelunasan" :venue="$venue">
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        Halo {{ $booking->customer_name }},<br>
        DP booking <strong>{{ $booking->code }}</strong> sudah masuk. Tinggal melunasi sisanya sebelum main.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f2;border-radius:6px;">
        <tr>
            <td style="padding:20px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#5b615a;">Sisa tagihan</p>
                <p style="margin:6px 0 0;font-size:28px;font-weight:700;">{{ $rupiah($booking->remaining_amount) }}</p>
                @if ($deadline)
                    <p style="margin:8px 0 0;font-size:13px;color:#b45309;">Batas pelunasan {{ $deadline }} WIB</p>
                @endif
            </td>
        </tr>
    </table>

    @include('emails.partials.booking-details', ['booking' => $booking])

    <p style="margin:24px 0 0;text-align:center;">
        <a href="{{ $actionUrl }}" style="display:inline-block;background:#1ed760;color:#050605;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:999px;">
            Lunasi sekarang
        </a>
    </p>

    <p style="margin:16px 0 0;font-size:13px;color:#5b615a;">
        Bisa juga dilunasi langsung di venue sebelum check-in. Kalau tidak dilunasi dan tidak datang, DP hangus sesuai ketentuan.
    </p>
</x-mail.pbs>
