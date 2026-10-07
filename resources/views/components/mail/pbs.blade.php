@props(['title', 'eyebrow', 'venue'])
{{-- Kerangka email PBS: header gelap, isi, lalu footer venue. --}}
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }}</title>
</head>
<body style="margin:0;padding:24px 12px;background:#f4f6f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0b0d0b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:6px;overflow:hidden;border:1px solid #e3e7de;">
        <tr>
            <td style="background:#050605;padding:24px;">
                <p style="margin:0;color:#1ed760;font-size:12px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;">{{ $eyebrow }}</p>
                <p style="margin:8px 0 0;color:#f4f6f2;font-size:24px;font-weight:700;">{{ $venue['name'] }}</p>
            </td>
        </tr>

        <tr>
            <td style="padding:24px;">
                {{ $slot }}
            </td>
        </tr>

        <tr>
            <td style="padding:20px 24px;background:#f4f6f2;font-size:12px;color:#5b615a;">
                <p style="margin:0;">{{ $venue['name'] }}@if ($venue['address'] ?? null) — {{ $venue['address'] }}@endif</p>
                @if ($venue['whatsapp'] ?? null)
                    <p style="margin:6px 0 0;">Butuh bantuan? WhatsApp {{ $venue['whatsapp'] }}</p>
                @endif
                <p style="margin:6px 0 0;">Semua waktu dalam zona WIB (Asia/Jakarta).</p>
            </td>
        </tr>
    </table>
</body>
</html>
