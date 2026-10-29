<?php

namespace Tests\Feature\Cron;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class CronTickTest extends TestCase
{
    use RefreshDatabase;

    public function test_ditolak_tanpa_secret_yang_benar(): void
    {
        config(['services.cron.secret' => 'rahasia']);

        $this->get(route('cron.tick'))->assertUnauthorized();
        $this->get(route('cron.tick'), ['Authorization' => 'Bearer salah'])->assertUnauthorized();
    }

    public function test_ditolak_bila_secret_belum_diatur(): void
    {
        config(['services.cron.secret' => null]);

        $this->get(route('cron.tick'), ['Authorization' => 'Bearer '])->assertUnauthorized();
    }

    public function test_menjalankan_scheduler_dan_queue(): void
    {
        config(['services.cron.secret' => 'rahasia']);

        Artisan::shouldReceive('call')->once()->with('schedule:run');
        Artisan::shouldReceive('call')->once()->with('queue:work', \Mockery::on(
            fn (array $options) => $options['--stop-when-empty'] === true && $options['--max-time'] === 40,
        ));

        $this->get(route('cron.tick'), ['Authorization' => 'Bearer rahasia'])
            ->assertOk()
            ->assertJson(['ok' => true]);
    }
}
