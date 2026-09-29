<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Kredensial Midtrans
    |--------------------------------------------------------------------------
    |
    | Server key hanya dipakai di sisi server (Core API & Snap). Client key boleh
    | dikirim ke browser untuk Snap.js. Jangan pernah commit nilai aslinya.
    |
    */

    'server_key' => env('MIDTRANS_SERVER_KEY'),
    'client_key' => env('MIDTRANS_CLIENT_KEY'),
    'merchant_id' => env('MIDTRANS_MERCHANT_ID'),
    'is_production' => (bool) env('MIDTRANS_IS_PRODUCTION', false),

    /*
    |--------------------------------------------------------------------------
    | QRIS di tempat (walk-in)
    |--------------------------------------------------------------------------
    |
    | acquirer: penerbit QR yang dipakai Core API (gopay / airpay shopee).
    | expiry_minutes: masa berlaku QR sebelum customer harus minta QR baru.
    |
    */

    'qris_acquirer' => env('MIDTRANS_QRIS_ACQUIRER', 'gopay'),
    'expiry_minutes' => (int) env('MIDTRANS_EXPIRY_MINUTES', 15),

];
