<?php

namespace Tests\Feature\Booking;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentProvider;
use App\Enums\PaymentType;
use App\Mail\BookingPendingMail;
use App\Mail\PaymentReceiptMail;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Invoice;
use App\Models\User;
use Database\Seeders\OperatingHourSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InvoiceTest extends TestCase
{
    use RefreshDatabase;

    protected Court $court;

    protected string $date;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(OperatingHourSeeder::class);
        $this->seed(SettingSeeder::class);

        Mail::fake();
        Storage::fake();

        $this->court = Court::factory()->create(['base_price' => 250000]);
        $this->date = now(Booking::TIMEZONE)->addDay()->toDateString();
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
            'slots' => ['08:00:00', '09:00:00'],
            'customer_name' => 'Andre Wijaya',
            'customer_email' => 'andre@example.com',
            'customer_email_confirmation' => 'andre@example.com',
            'customer_phone' => '081200000001',
            'players_count' => 4,
            'terms' => true,
            ...$overrides,
        ];
    }

    protected function createGuestBooking(): Booking
    {
        $this->post(route('booking.store'), $this->payload())->assertRedirect();

        return Booking::query()->latest('id')->firstOrFail();
    }

    public function test_invoice_is_issued_when_a_booking_is_created(): void
    {
        $booking = $this->createGuestBooking();
        $invoice = $booking->invoice;

        $this->assertNotNull($invoice);
        $this->assertSame(InvoiceStatus::Unpaid, $invoice->status);
        $this->assertSame(500000, $invoice->total);
        $this->assertSame(500000, $invoice->remaining_amount);
        $this->assertStringStartsWith('INV/PBS/'.now(Booking::TIMEZONE)->format('Y/m').'/', $invoice->number);
    }

    public function test_invoice_numbers_run_in_sequence(): void
    {
        $first = $this->createGuestBooking();
        $this->flushSession();

        $this->post(route('booking.store'), $this->payload([
            'slots' => ['12:00:00'],
            'customer_email' => 'lain@example.com',
            'customer_email_confirmation' => 'lain@example.com',
        ]));

        $second = Booking::query()->latest('id')->firstOrFail();

        $prefix = 'INV/PBS/'.now(Booking::TIMEZONE)->format('Y/m').'/';

        $this->assertSame($prefix.'000001', $first->invoice->number);
        $this->assertSame($prefix.'000002', $second->invoice->number);
    }

    public function test_pending_payment_email_is_sent_once_when_the_booking_is_created(): void
    {
        $booking = $this->createGuestBooking();

        Mail::assertQueued(BookingPendingMail::class, fn (BookingPendingMail $mail) => $mail->hasTo('andre@example.com')
            && $mail->booking->is($booking));

        // Dipanggil ulang (mis. kirim ulang link) tidak menggandakan email.
        $booking->sendPendingPaymentNotice();

        Mail::assertQueuedCount(1);
    }

    public function test_invoice_follows_payment_progress(): void
    {
        $booking = $this->createGuestBooking();
        $admin = User::factory()->admin()->create();

        $booking->recordOfflinePayment(150000, PaymentProvider::Cash, PaymentType::Dp, $admin->id);
        $this->assertSame(InvoiceStatus::Partial, $booking->invoice->refresh()->status);
        $this->assertSame(350000, $booking->invoice->remaining_amount);

        $booking->recordOfflinePayment(350000, PaymentProvider::Cash, PaymentType::Settlement, $admin->id);
        $invoice = $booking->invoice->refresh();

        $this->assertSame(InvoiceStatus::Paid, $invoice->status);
        $this->assertSame(0, $invoice->remaining_amount);
        $this->assertNotNull($invoice->paid_at);
    }

    public function test_cancelled_unpaid_booking_voids_its_invoice(): void
    {
        $booking = $this->createGuestBooking();

        $booking->cancel(null, 'Salah pilih jam');

        $this->assertSame(InvoiceStatus::Void, $booking->invoice->refresh()->status);
    }

    public function test_receipt_email_attaches_the_invoice_pdf(): void
    {
        $booking = $this->createGuestBooking();
        $booking->recordOfflinePayment(500000, PaymentProvider::Cash, PaymentType::Full, User::factory()->admin()->create()->id);

        $mail = new PaymentReceiptMail($booking->refresh());

        $this->assertTrue(
            collect($mail->attachments())->contains(fn ($attachment) => $attachment->as === $booking->invoice->fileName()),
        );
    }

    public function test_pdf_is_rendered_and_cached_on_disk(): void
    {
        $booking = $this->createGuestBooking();
        $invoice = $booking->invoice;

        $contents = $invoice->pdfContents();

        $this->assertStringStartsWith('%PDF', $contents);
        $this->assertNotNull($invoice->refresh()->pdf_path);
        Storage::assertExists($invoice->pdf_path);
    }

    public function test_guest_can_open_the_invoice_through_a_signed_link_only(): void
    {
        $booking = $this->createGuestBooking();
        $invoice = $booking->invoice;
        $signed = $invoice->signedUrl();

        $this->flushSession();

        $this->get($signed)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Invoices/Show')
                ->where('invoice.number', $invoice->number)
                ->where('booking.code', $booking->code));

        $this->get(route('invoices.show', $invoice->number))->assertForbidden();
    }

    public function test_member_can_open_and_download_their_own_invoice(): void
    {
        $member = User::factory()->create();
        $booking = Booking::factory()->forMember($member)->create(['court_id' => $this->court->id]);
        $invoice = Invoice::issueFor($booking);

        $this->actingAs($member)->get(route('invoices.show', $invoice->number))->assertOk();

        $response = $this->actingAs($member)->get(route('invoices.pdf', $invoice->number));

        $response->assertOk()->assertHeader('content-type', 'application/pdf');
        $this->assertStringContainsString($invoice->fileName(), $response->headers->get('content-disposition'));

        $this->actingAs(User::factory()->create())->get(route('invoices.show', $invoice->number))->assertForbidden();
    }
}
