@php
    use Illuminate\Support\Carbon;

    $time = fn ($value) => substr($value, 0, 5);
@endphp
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;font-size:14px;">
    <tr>
        <td style="padding:8px 0;color:#5b615a;">Lapangan</td>
        <td style="padding:8px 0;text-align:right;font-weight:600;">{{ $booking->court?->name }}</td>
    </tr>
    <tr>
        <td style="padding:8px 0;color:#5b615a;">Tanggal</td>
        <td style="padding:8px 0;text-align:right;font-weight:600;">{{ Carbon::parse($booking->date)->locale('id')->translatedFormat('l, j F Y') }}</td>
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
