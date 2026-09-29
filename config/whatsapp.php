<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Gateway WhatsApp (Fonnte)
    |--------------------------------------------------------------------------
    |
    | driver "log" hanya menulis pesan ke log (dipakai saat lokal/belum berlangganan),
    | "fonnte" mengirim sungguhan lewat API Fonnte. Token diambil dari dashboard Fonnte
    | dan hanya dipakai di sisi server.
    |
    */

    'driver' => env('WHATSAPP_DRIVER', 'log'),

    'token' => env('FONNTE_TOKEN'),

    'base_url' => env('FONNTE_BASE_URL', 'https://api.fonnte.com'),

    /*
    |--------------------------------------------------------------------------
    | Nomor pengirim (opsional)
    |--------------------------------------------------------------------------
    |
    | Diisi bila akun Fonnte punya lebih dari satu perangkat terhubung.
    |
    */

    'device' => env('FONNTE_DEVICE'),

];
