@php
    use Illuminate\Support\Carbon;

    $rupiah = fn ($value) => 'Rp'.number_format((int) $value, 0, ',', '.');
    $time = fn ($value) => substr($value, 0, 5);
    $statusLabel = ['unpaid' => 'BELUM DIBAYAR', 'partial' => 'DP', 'paid' => 'LUNAS', 'void' => 'BATAL'][$invoice->status->value];
    $statusColor = ['unpaid' => '#b45309', 'partial' => '#65a30d', 'paid' => '#15803d', 'void' => '#6b7280'][$invoice->status->value];
    $typeLabel = ['full' => 'Bayar penuh', 'dp' => 'DP', 'settlement' => 'Pelunasan', 'offline' => 'Di venue'];
@endphp
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $invoice->number }}</title>
    <style>
        @page { margin: 32px 36px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #0b0d0b; }
        h1 { font-size: 20px; margin: 0; letter-spacing: .04em; }
        table { width: 100%; border-collapse: collapse; }
        .muted { color: #5b615a; }
        .right { text-align: right; }
        .head td { vertical-align: top; padding-bottom: 20px; }
        .status { display: inline-block; padding: 5px 12px; border-radius: 999px; color: #fff; font-weight: bold; letter-spacing: .08em; }
        .items th { text-align: left; border-bottom: 1px solid #0b0d0b; padding: 7px 0; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }
        .items td { border-bottom: 1px solid #e3e7de; padding: 7px 0; }
        .totals td { padding: 4px 0; }
        .totals .grand td { border-top: 1px solid #0b0d0b; font-size: 13px; font-weight: bold; padding-top: 8px; }
        .section { margin-top: 24px; }
        .section h2 { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; margin: 0 0 8px; color: #5b615a; }
        .footer { margin-top: 28px; border-top: 1px solid #e3e7de; padding-top: 10px; font-size: 10px; }
    </style>
</head>
<body>
    <table class="head">
        <tr>
            <td style="width:60%;">
                <h1>{{ $venue['name'] }}</h1>
                @if ($venue['address'])<div class="muted" style="margin-top:4px;">{{ $venue['address'] }}</div>@endif
                @if ($venue['whatsapp'])<div class="muted">WhatsApp {{ $venue['whatsapp'] }}</div>@endif
                @if ($venue['tax_id'])<div class="muted">NPWP {{ $venue['tax_id'] }}</div>@endif
            </td>
            <td class="right">
                <div class="status" style="background:{{ $statusColor }};">{{ $statusLabel }}</div>
                <div style="margin-top:10px;font-size:13px;font-weight:bold;">{{ $invoice->number }}</div>
                <div class="muted">Terbit {{ $invoice->issued_at->timezone(\App\Models\Booking::TIMEZONE)->locale('id')->translatedFormat('j F Y') }}</div>
                <div class="muted">Booking {{ $booking->code }}</div>
            </td>
        </tr>
    </table>

    <table>
        <tr>
            <td style="width:50%;">
                <div class="muted">Ditagihkan kepada</div>
                <div style="font-weight:bold;margin-top:4px;">{{ $invoice->billed_name }}</div>
                @if ($invoice->billed_email)<div>{{ $invoice->billed_email }}</div>@endif
                <div>{{ $invoice->billed_phone }}</div>
            </td>
            <td style="width:50%;">
                <div class="muted">Jadwal main</div>
                <div style="font-weight:bold;margin-top:4px;">{{ $booking->court?->name }}</div>
                <div>{{ Carbon::parse($booking->date)->locale('id')->translatedFormat('l, j F Y') }}</div>
                <div>{{ $time($booking->start_time) }}–{{ $time($booking->end_time) }} WIB · {{ $booking->players_count }} pemain</div>
            </td>
        </tr>
    </table>

    <div class="section">
        <table class="items">
            <thead>
                <tr>
                    <th>Deskripsi</th>
                    <th class="right">Jam</th>
                    <th class="right">Harga</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($booking->items as $item)
                    <tr>
                        <td>Sewa {{ $booking->court?->name }}</td>
                        <td class="right">{{ $time($item->start_time) }}–{{ $time($item->end_time) }}</td>
                        <td class="right">{{ $rupiah($item->price) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <table class="totals" style="margin-top:14px;">
        <tr>
            <td style="width:65%;"></td>
            <td class="muted">Subtotal</td>
            <td class="right">{{ $rupiah($invoice->subtotal) }}</td>
        </tr>
        @if ($invoice->discount > 0)
            <tr>
                <td></td>
                <td class="muted">Diskon</td>
                <td class="right">−{{ $rupiah($invoice->discount) }}</td>
            </tr>
        @endif
        @if ($invoice->service_fee > 0)
            <tr>
                <td></td>
                <td class="muted">Biaya layanan</td>
                <td class="right">{{ $rupiah($invoice->service_fee) }}</td>
            </tr>
        @endif
        <tr class="grand">
            <td></td>
            <td>Total</td>
            <td class="right">{{ $rupiah($invoice->total) }}</td>
        </tr>
        <tr>
            <td></td>
            <td class="muted">Sudah dibayar</td>
            <td class="right">{{ $rupiah($invoice->paid_amount) }}</td>
        </tr>
        <tr>
            <td></td>
            <td style="font-weight:bold;">Sisa tagihan</td>
            <td class="right" style="font-weight:bold;">{{ $rupiah($invoice->remaining_amount) }}</td>
        </tr>
    </table>

    @if ($booking->payments->isNotEmpty())
        <div class="section">
            <h2>Riwayat pembayaran</h2>
            <table class="items">
                <thead>
                    <tr>
                        <th>Tanggal</th>
                        <th>Jenis</th>
                        <th>Metode / referensi</th>
                        <th class="right">Nominal</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($booking->payments->sortBy('created_at') as $payment)
                        <tr>
                            <td>{{ ($payment->paid_at ?? $payment->created_at)->timezone(\App\Models\Booking::TIMEZONE)->format('d/m/Y H:i') }}</td>
                            <td>{{ $typeLabel[$payment->type->value] ?? $payment->type->value }}</td>
                            <td>{{ $payment->payment_method ?? $payment->provider->value }} · {{ $payment->order_id }}</td>
                            <td class="right">{{ $payment->isSettled() ? $rupiah($payment->amount) : '—' }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif

    <div class="footer muted">
        {{ $venue['note'] }}
        <div style="margin-top:4px;">Dokumen ini dibuat otomatis oleh sistem PBS dan sah tanpa tanda tangan.</div>
    </div>
</body>
</html>
