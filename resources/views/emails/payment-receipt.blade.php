@php
    use Illuminate\Support\Carbon;

    $rupiah = fn ($value) => 'Rp'.number_format((int) $value, 0, ',', '.');
    $time = fn ($value) => substr($value, 0, 5);
    $date = Carbon::parse($booking->date)->locale('id')->translatedFormat('l, j F Y');
@endphp
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $isPaid ? 'Pembayaran lunas' : 'DP diterima' }} — {{ $booking->code }}</title>
</head>
<body style="margin:0;padding:24px 12px;background:#f4f6f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0b0d0b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:6px;overflow:hidden;border:1px solid #e3e7de;">
        <tr>
            <td style="background:#050605;padding:24px;">
                <p style="margin:0;color:#1ed760;font-size:12px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;">
                    {{ $isPaid ? 'Pembayaran lunas' : 'DP diterima' }}
                </p>
                <p style="margin:8px 0 0;color:#f4f6f2;font-size:24px;font-weight:700;">{{ $venue['name'] }}</p>
            </td>
        </tr>

        <tr>
            <td style="padding:24px;">
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

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;font-size:14px;">
                    <tr>
                        <td style="padding:8px 0;color:#5b615a;">Lapangan</td>
                        <td style="padding:8px 0;text-align:right;font-weight:600;">{{ $booking->court?->name }}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;color:#5b615a;">Tanggal</td>
                        <td style="padding:8px 0;text-align:right;font-weight:600;">{{ $date }}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;color:#5b615a;">Jam</td>
                        <td style="padding:8px 0;text-align:right;font-weight:600;">{{ $time($booking->start_time) }}–{{ $time($booking->end_time) }} WIB</td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;color:#5b615a;">Pemain</td>
                        <td style="padding:8px 0;text-align:right;font-weight:600;">{{ $booking->players_count }} orang</td>
                    </tr>
                </table>

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

                <p style="margin:24px 0 0;text-align:center;">
                    <a href="{{ $actionUrl }}" style="display:inline-block;background:#1ed760;color:#050605;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:999px;">
                        {{ $isPaid ? 'Lihat e-ticket' : 'Lihat & lunasi booking' }}
                    </a>
                </p>
            </td>
        </tr>

        <tr>
            <td style="padding:20px 24px;background:#f4f6f2;font-size:12px;color:#5b615a;">
                <p style="margin:0;">{{ $venue['name'] }}@if ($venue['address']) — {{ $venue['address'] }}@endif</p>
                @if ($venue['whatsapp'])
                    <p style="margin:6px 0 0;">Butuh bantuan? WhatsApp {{ $venue['whatsapp'] }}</p>
                @endif
                <p style="margin:6px 0 0;">Semua waktu dalam zona WIB (Asia/Jakarta).</p>
            </td>
        </tr>
    </table>
</body>
</html>
