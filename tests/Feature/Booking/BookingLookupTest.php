<?php

namespace Tests\Feature\Booking;

use App\Mail\BookingLinkMail;
use App\Models\Booking;
use App\Models\Court;
use Database\Seeders\OperatingHourSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BookingLookupTest extends TestCase
{
    use RefreshDatabase;

    protected Booking $booking;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(OperatingHourSeeder::class);
        $this->seed(SettingSeeder::class);

        Mail::fake();

        $this->booking = Booking::factory()->create([
            'court_id' => Court::factory(),
            'customer_email' => 'andre@example.com',
        ]);
    }

    public function test_lookup_page_is_public(): void
    {
        $this->get(route('booking.lookup'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Booking/Lookup'));
    }

    public function test_matching_code_and_email_get_the_link_by_email(): void
    {
        $this->post(route('booking.lookup'), ['code' => $this->booking->code, 'email' => 'andre@example.com'])
            ->assertSessionHas('status')
            ->assertSessionHasNoErrors();

        Mail::assertQueued(BookingLinkMail::class, fn (BookingLinkMail $mail) => $mail->hasTo('andre@example.com')
            && $mail->booking->is($this->booking));
    }

    public function test_code_is_matched_case_insensitively(): void
    {
        $this->post(route('booking.lookup'), ['code' => strtolower($this->booking->code), 'email' => 'ANDRE@example.com'])
            ->assertSessionHasNoErrors();

        Mail::assertQueued(BookingLinkMail::class);
    }

    public function test_wrong_email_sends_nothing_but_answers_the_same(): void
    {
        $this->post(route('booking.lookup'), ['code' => $this->booking->code, 'email' => 'orang.lain@example.com'])
            ->assertSessionHas('status')
            ->assertSessionHasNoErrors();

        Mail::assertNothingQueued();
    }

    public function test_unknown_code_sends_nothing(): void
    {
        $this->post(route('booking.lookup'), ['code' => 'PBS-ZZZZZZ', 'email' => 'andre@example.com']);

        Mail::assertNothingQueued();
    }

    public function test_requests_are_rate_limited(): void
    {
        foreach (range(1, 5) as $attempt) {
            $this->post(route('booking.lookup'), ['code' => 'PBS-ZZZZZZ', 'email' => 'andre@example.com'])->assertRedirect();
        }

        $this->post(route('booking.lookup'), ['code' => 'PBS-ZZZZZZ', 'email' => 'andre@example.com'])->assertStatus(429);
    }
}
