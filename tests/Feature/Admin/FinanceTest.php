<?php

namespace Tests\Feature\Admin;

use App\Enums\BookingStatus;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\RefundStatus;
use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\OperatingHourSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FinanceTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;

    protected User $admin;

    protected Court $court;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(OperatingHourSeeder::class);
        $this->seed(SettingSeeder::class);

        $this->owner = User::factory()->owner()->create();
        $this->admin = User::factory()->admin()->create();
        $this->court = Court::factory()->create(['name' => 'Court A']);

        $this->travelTo(CarbonImmutable::parse('2026-10-10 12:00:00', Booking::TIMEZONE));
    }

    protected function paidBooking(array $overrides = []): Booking
    {
        $booking = Booking::factory()->create([
            'court_id' => $this->court->id,
            'total' => 300000,
            'paid_amount' => 0,
            'remaining_amount' => 300000,
            'payment_status' => PaymentStatus::Unpaid,
            'date' => '2026-10-09',
            ...$overrides,
        ]);

        $booking->recordOfflinePayment(300000, PaymentProvider::Cash, PaymentType::Full, $this->admin->id);

        return $booking->refresh();
    }

    public function test_payment_list_is_filterable_and_hides_totals_from_admin(): void
    {
        $this->paidBooking();

        $this->actingAs($this->owner)
            ->get(route('admin.payments.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Payments/Index')
                ->has('payments.data', 1)
                ->where('summary.settled', 300000));

        $this->actingAs($this->admin)
            ->get(route('admin.payments.index'))
            ->assertInertia(fn (Assert $page) => $page->where('summary', null));

        $this->actingAs($this->owner)
            ->get(route('admin.payments.index', ['provider' => 'midtrans']))
            ->assertInertia(fn (Assert $page) => $page->has('payments.data', 0));
    }

    public function test_receivables_list_only_shows_unsettled_active_bookings(): void
    {
        $this->paidBooking();

        $unsettled = Booking::factory()->create([
            'court_id' => $this->court->id,
            'date' => '2026-10-12',
            'status' => BookingStatus::Confirmed,
            'payment_status' => PaymentStatus::DpPaid,
            'paid_amount' => 90000,
            'remaining_amount' => 210000,
            'settlement_due_at' => CarbonImmutable::parse('2026-10-12 12:00:00', Booking::TIMEZONE)->utc(),
        ]);

        $this->actingAs($this->admin)
            ->get(route('admin.receivables.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Receivables/Index')
                ->has('receivables.data', 1)
                ->where('receivables.data.0.code', $unsettled->code)
                ->where('summary.total', 210000));
    }

    public function test_overdue_scope_lists_bookings_past_their_settlement_deadline(): void
    {
        Booking::factory()->create([
            'court_id' => $this->court->id,
            'date' => '2026-10-11',
            'status' => BookingStatus::Confirmed,
            'payment_status' => PaymentStatus::DpPaid,
            'paid_amount' => 90000,
            'remaining_amount' => 210000,
            'settlement_due_at' => CarbonImmutable::parse('2026-10-09 12:00:00', Booking::TIMEZONE)->utc(),
        ]);

        $this->actingAs($this->admin)
            ->get(route('admin.receivables.index', ['scope' => 'overdue']))
            ->assertInertia(fn (Assert $page) => $page->has('receivables.data', 1)->where('summary.overdue', 1));
    }

    public function test_invoice_list_shows_issued_invoices_with_links(): void
    {
        $booking = $this->paidBooking();
        $invoice = $booking->invoice;

        $this->actingAs($this->owner)
            ->get(route('admin.invoices.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Invoices/Index')
                ->has('invoices.data', 1)
                ->where('invoices.data.0.number', $invoice->number)
                ->where('invoices.data.0.pdf_url', route('invoices.pdf', $invoice->number))
                ->where('summary.paid', 300000));

        $this->actingAs($this->owner)
            ->get(route('admin.invoices.index', ['status' => 'unpaid']))
            ->assertInertia(fn (Assert $page) => $page->has('invoices.data', 0));
    }

    public function test_report_is_owner_only_and_counts_settled_payments(): void
    {
        $this->paidBooking();

        $this->actingAs($this->owner)
            ->get(route('admin.reports.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Reports/Index')
                ->where('summary.revenue', 300000)
                ->where('summary.bookings', 1)
                ->where('courts.0.name', 'Court A')
                ->where('courts.0.value', 300000)
                ->where('paymentMethods.0.label', 'cash'));

        $this->actingAs($this->admin)->get(route('admin.reports.index'))->assertForbidden();
    }

    public function test_report_can_be_exported_as_csv(): void
    {
        $booking = $this->paidBooking();

        $response = $this->actingAs($this->owner)->get(route('admin.reports.export'));

        $response->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString($booking->code, $response->streamedContent());
    }

    public function test_refund_can_be_recorded_and_updates_payment_status(): void
    {
        $booking = $this->paidBooking(['status' => BookingStatus::Confirmed, 'date' => '2026-10-20']);
        $booking->cancel($this->admin->id, 'Customer berhalangan');

        $this->assertSame(RefundStatus::Requested, $booking->refresh()->refund_status);

        $this->actingAs($this->admin)
            ->patch(route('admin.bookings.refund', $booking), ['status' => 'processed', 'amount' => 300000])
            ->assertSessionHasNoErrors();

        $booking->refresh();

        $this->assertSame(RefundStatus::Processed, $booking->refund_status);
        $this->assertSame(300000, $booking->refund_amount);
        $this->assertSame(PaymentStatus::Refunded, $booking->payment_status);
    }

    public function test_partial_refund_is_marked_as_partially_refunded(): void
    {
        $booking = $this->paidBooking(['status' => BookingStatus::Confirmed, 'date' => '2026-10-20']);
        $booking->cancel($this->admin->id, null);

        $this->actingAs($this->admin)
            ->patch(route('admin.bookings.refund', $booking), ['status' => 'processed', 'amount' => 150000])
            ->assertSessionHasNoErrors();

        $this->assertSame(PaymentStatus::PartiallyRefunded, $booking->refresh()->payment_status);
    }

    public function test_refund_amount_cannot_exceed_what_was_paid(): void
    {
        $booking = $this->paidBooking(['status' => BookingStatus::Confirmed, 'date' => '2026-10-20']);
        $booking->cancel($this->admin->id, null);

        $this->actingAs($this->admin)
            ->patch(route('admin.bookings.refund', $booking), ['status' => 'processed', 'amount' => 500000])
            ->assertSessionHasErrors('amount');
    }

    public function test_refund_can_be_rejected(): void
    {
        $booking = $this->paidBooking(['status' => BookingStatus::Confirmed, 'date' => '2026-10-20']);
        $booking->cancel($this->admin->id, null);

        $this->actingAs($this->admin)
            ->patch(route('admin.bookings.refund', $booking), ['status' => 'rejected'])
            ->assertSessionHasNoErrors();

        $booking->refresh();

        $this->assertSame(RefundStatus::Rejected, $booking->refund_status);
        $this->assertSame(PaymentStatus::Paid, $booking->payment_status);
    }

    public function test_customers_cannot_reach_finance_pages(): void
    {
        $customer = User::factory()->create();

        foreach (['admin.payments.index', 'admin.receivables.index', 'admin.invoices.index', 'admin.reports.index'] as $name) {
            $this->actingAs($customer)->get(route($name))->assertForbidden();
        }
    }
}
