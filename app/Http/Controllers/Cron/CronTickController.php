<?php

namespace App\Http\Controllers\Cron;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

/**
 * Pengganti `schedule:work` + `queue:work` di hosting serverless (Vercel):
 * dipanggil tiap menit oleh Vercel Cron atau pg_cron Supabase.
 */
class CronTickController extends Controller
{
    public function __invoke(Request $request)
    {
        $secret = config('services.cron.secret');

        abort_unless($secret && hash_equals("Bearer {$secret}", (string) $request->header('Authorization')), 401);

        Artisan::call('schedule:run');

        // Kirim email yang antre, berhenti sebelum batas durasi function habis.
        Artisan::call('queue:work', [
            '--stop-when-empty' => true,
            '--max-time' => (int) config('services.cron.queue_max_time'),
            '--tries' => 3,
        ]);

        return response()->json(['ok' => true]);
    }
}
