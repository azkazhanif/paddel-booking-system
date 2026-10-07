@php
    use Illuminate\Support\Carbon;

    $rupiah = fn ($value) => 'Rp'.number_format((int) $value, 0, ',', '.');
    $time = fn ($value) => substr($value, 0, 5);
@endphp
<x-mail.pbs :title="($isPaid ? 'Pembayaran lunas' : 'DP diterima').' — '.$booking->code" :eyebrow="$isPaid ? 'Pembayaran lunas' : 'DP diterima'" :venue="$venue">
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        Halo {{ $booking->customer_name }},<br>
        @if ($isPaid)
            pembayaran booking kamu sudah kami terima dengan lengkap. Tunjukkan kode di bawah saat tiba di venue.
        @else
            DP kamu sudah kami terima dan slot sudah dikunci. Sisa tagihan bisa dilunasi online atau di venue sebelum main.
        @endif
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f2;border-radius:6px;">
        <tr>
            <td style="padding:20px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#5b615a;">Kode booking / e-ticket</p>
                <p style="margin:6px 0 0;font-size:28px;font-weight:700;letter-spacing:.12em;">{{ $booking->code }}</p>
            </td>
        </tr>
    </table>

    @include('emails.partials.booking-details', ['booking' => $booking])

    <hr style="border:none;border-top:1px solid #e3e7de;margin:20px 0;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
        @foreach ($booking->items as $item)
            <tr>
                <td style="padding:6px 0;color:#5b615a;">{{ $time($item->start_time) }}–{{ $time($item->end_time) }}</td>
                <td style="padding:6px 0;text-align:right;">{{ $rupiah($item->price) }}</td>
            </tr>
        @endforeach
        @if ($booking->service_fee > 0)
            <tr>
                <td style="padding:6px 0;color:#5b615a;">Biaya layanan</td>
                <td style="padding:6px 0;text-align:right;">{{ $rupiah($booking->service_fee) }}</td>
            </tr>
        @endif
        <tr>
            <td style="padding:10px 0 0;font-weight:700;border-top:1px solid #e3e7de;">Total</td>
            <td style="padding:10px 0 0;text-align:right;font-weight:700;border-top:1px solid #e3e7de;">{{ $rupiah($booking->total) }}</td>
        </tr>
        <tr>
            <td style="padding:6px 0;color:#5b615a;">Sudah dibayar</td>
            <td style="padding:6px 0;text-align:right;color:#15803d;font-weight:600;">{{ $rupiah($booking->paid_amount) }}</td>
        </tr>
        @if ($booking->remaining_amount > 0)
            <tr>
                <td style="padding:6px 0;color:#5b615a;">Sisa tagihan</td>
                <td style="padding:6px 0;text-align:right;color:#b45309;font-weight:700;">{{ $rupiah($booking->remaining_amount) }}</td>
            </tr>
        @endif
    </table>

    @if (! $isPaid && $booking->settlement_due_at)
        <p style="margin:16px 0 0;font-size:13px;color:#b45309;">
            Batas pelunasan: {{ $booking->settlement_due_at->timezone(\App\Models\Booking::TIMEZONE)->locale('id')->translatedFormat('l, j F Y H:i') }} WIB.
        </p>
    @endif

    @if ($invoiceNumber)
        <p style="margin:16px 0 0;font-size:13px;color:#5b615a;">
            Invoice <strong>{{ $invoiceNumber }}</strong> terlampir di email ini.
            @if ($invoiceUrl)
                Versi webnya bisa dibuka di <a href="{{ $invoiceUrl }}" style="color:#15803d;">halaman invoice</a>.
            @endif
        </p>
    @endif

    <p style="margin:24px 0 0;text-align:center;">
        <a href="{{ $actionUrl }}" style="display:inline-block;background:#1ed760;color:#050605;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:999px;">
            {{ $isPaid ? 'Lihat e-ticket' : 'Lihat & lunasi booking' }}
        </a>
    </p>
</x-mail.pbs>
