<?php

namespace App\Http\Controllers\Invoice;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * Invoice versi web & PDF. Pemilik booking bisa membukanya dari akunnya, sedangkan
 * tamu memakai link signed yang dikirim lewat email.
 */
class InvoiceController extends Controller
{
    public function show(Request $request, Invoice $invoice)
    {
        $this->authorizeAccess($request, $invoice);

        $invoice->load(['booking.court:id,name,type', 'booking.items', 'booking.payments']);

        return Inertia::render('Invoices/Show', [
            'invoice' => [
                ...$invoice->only([
                    'number', 'status', 'billed_name', 'billed_email', 'billed_phone',
                    'subtotal', 'discount', 'service_fee', 'total', 'paid_amount', 'remaining_amount',
                    'issued_at', 'paid_at',
                ]),
                'pdf_url' => $request->hasValidSignature()
                    ? $invoice->signedPdfUrl()
                    : route('invoices.pdf', $invoice->number),
            ],
            'booking' => [
                ...$invoice->booking->only(['code', 'date', 'start_time', 'end_time', 'players_count', 'status', 'payment_status']),
                'court' => $invoice->booking->court?->only(['id', 'name', 'type']),
                'items' => $invoice->booking->items->map->only(['start_time', 'end_time', 'price', 'price_label'])->values(),
            ],
            'payments' => $invoice->booking->payments
                ->sortBy('created_at')
                ->map(fn (Payment $payment) => [
                    ...$payment->only(['order_id', 'type', 'amount', 'status', 'payment_method', 'paid_at']),
                    'provider' => $payment->provider->value,
                ])
                ->values(),
            'venue' => [
                'name' => Setting::get('invoice.company_name', Setting::get('venue.name', 'PBS Padel Club')),
                'address' => Setting::get('venue.address', ''),
                'whatsapp' => Setting::get('venue.whatsapp', ''),
                'tax_id' => Setting::get('invoice.tax_id'),
                'note' => Setting::get('invoice.footer_note', ''),
            ],
        ]);
    }

    public function pdf(Request $request, Invoice $invoice): Response
    {
        $this->authorizeAccess($request, $invoice);

        return response($invoice->pdfContents(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$invoice->fileName().'"',
        ]);
    }

    /**
     * Akses invoice: link signed dari email, atau izin atas booking yang menaunginya.
     */
    protected function authorizeAccess(Request $request, Invoice $invoice): void
    {
        if ($request->hasValidSignature()) {
            return;
        }

        Gate::authorize('view', $invoice->booking);
    }
}
