<?php

use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Vercel (dan reverse proxy lain) meneruskan HTTPS lewat header X-Forwarded-*.
        $middleware->trustProxies(at: '*');

        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => EnsureUserHasRole::class,
        ]);

        // Webhook Midtrans tidak membawa token CSRF; keasliannya dicek lewat signature.
        $middleware->validateCsrfTokens(except: [
            'midtrans/notification',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();

// Di Vercel hanya /tmp yang bisa ditulis: view terkompilasi, cache font dompdf, dan log diarahkan ke sana.
if (getenv('VERCEL')) {
    $storage = '/tmp/storage';

    foreach (['app/private', 'app/public', 'framework/cache/data', 'framework/sessions', 'framework/views', 'fonts', 'logs'] as $dir) {
        is_dir("{$storage}/{$dir}") || mkdir("{$storage}/{$dir}", 0755, true);
    }

    $app->useStoragePath($storage);
}

return $app;
