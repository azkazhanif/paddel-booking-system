<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cloudflare Turnstile
    |--------------------------------------------------------------------------
    |
    | Proteksi bot untuk booking tanpa akun (BR-G5). Bila site key atau secret
    | kosong, verifikasi dilewati — praktis saat pengembangan lokal.
    |
    */

    'site_key' => env('TURNSTILE_SITE_KEY'),

    'secret' => env('TURNSTILE_SECRET'),

    'verify_url' => env('TURNSTILE_VERIFY_URL', 'https://challenges.cloudflare.com/turnstile/v0/siteverify'),

];
