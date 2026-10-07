<?php

namespace Tests\Feature\Booking;

use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use Database\Seeders\OperatingHourSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TurnstileTest extends TestCase
{
    use RefreshDatabase;

    protected Court $court;

    protected string $date;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(OperatingHourSeeder::class);
        $this->seed(SettingSeeder::class);

        $this->court = Court::factory()->create();
        $this->date = now(Booking::TIMEZONE)->addDay()->toDateString();

        config()->set('turnstile.site_key', 'site-key-test');
        config()->set('turnstile.secret', 'secret-test');
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function payload(array $overrides = []): array
    {
        return [
            'court_id' => $this->court->id,
            'date' => $this->date,
            'slots' => ['08:00:00'],
            'customer_name' => 'Andre',
            'customer_email' => 'andre@example.com',
            'customer_email_confirmation' => 'andre@example.com',
            'customer_phone' => '081200000001',
            'players_count' => 4,
            'terms' => true,
            ...$overrides,
        ];
    }

    public function test_site_key_is_sent_to_the_booking_page_when_configured(): void
    {
        $this->get(route('booking.create'))
            ->assertInertia(fn (Assert $page) => $page->where('turnstileSiteKey', 'site-key-test'));

        config()->set('turnstile.secret', null);

        $this->get(route('booking.create'))
            ->assertInertia(fn (Assert $page) => $page->where('turnstileSiteKey', null));
    }

    public function test_guest_booking_requires_a_valid_token(): void
    {
        Http::fake(['challenges.cloudflare.com/*' => Http::response(['success' => true])]);

        $this->post(route('booking.store'), $this->payload())->assertSessionHasErrors('turnstile_token');
        $this->assertSame(0, Booking::query()->count());

        $this->post(route('booking.store'), $this->payload(['turnstile_token' => 'token-oke']))->assertRedirect();
        $this->assertSame(1, Booking::query()->count());

        Http::assertSent(fn ($request) => $request['secret'] === 'secret-test' && $request['response'] === 'token-oke');
    }

    public function test_rejected_token_blocks_the_booking(): void
    {
        Http::fake(['challenges.cloudflare.com/*' => Http::response(['success' => false, 'error-codes' => ['invalid-input-response']])]);

        $this->post(route('booking.store'), $this->payload(['turnstile_token' => 'token-palsu']))
            ->assertSessionHasErrors('turnstile_token');

        $this->assertSame(0, Booking::query()->count());
    }

    public function test_members_skip_the_challenge(): void
    {
        Http::fake();

        $member = User::factory()->create();

        $this->actingAs($member)->post(route('booking.store'), $this->payload())->assertRedirect();

        $this->assertSame(1, Booking::query()->count());
        Http::assertNothingSent();
    }

    public function test_challenge_is_skipped_when_credentials_are_missing(): void
    {
        Http::fake();

        config()->set('turnstile.secret', null);

        $this->post(route('booking.store'), $this->payload())->assertRedirect();

        $this->assertSame(1, Booking::query()->count());
        Http::assertNothingSent();
    }
}
