<?php

namespace App\Http\Controllers\Admin\Invoice;

use App\Enums\InvoiceStatus;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Daftar invoice yang sudah terbit, lengkap dengan tautan ke versi web & PDF.
 */
class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(InvoiceStatus::class)],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $query = Invoice::query()
            ->with('booking:id,code,date,court_id', 'booking.court:id,name')
            ->when($filters['search'] ?? null, fn (Builder $query, string $search) => $query->where(fn (Builder $query) => $query
                ->where('number', 'like', "%{$search}%")
                ->orWhere('billed_name', 'like', "%{$search}%")
                ->orWhere('billed_email', 'like', "%{$search}%")
                ->orWhereHas('booking', fn (Builder $query) => $query->where('code', 'like', "%{$search}%"))))
            ->when($filters['status'] ?? null, fn (Builder $query, string $status) => $query->where('status', $status))
            ->when($filters['date_from'] ?? null, fn (Builder $query, string $date) => $query->whereDate('issued_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn (Builder $query, string $date) => $query->whereDate('issued_at', '<=', $date));

        $invoices = (clone $query)
            ->latest('issued_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Invoice $invoice) => [
                ...$invoice->only(['id', 'number', 'status', 'billed_name', 'billed_email', 'total', 'paid_amount', 'remaining_amount', 'issued_at']),
                'booking' => [
                    'id' => $invoice->booking->id,
                    'code' => $invoice->booking->code,
                    'date' => $invoice->booking->date->toDateString(),
                    'court' => $invoice->booking->court?->name,
                ],
                'url' => route('invoices.show', $invoice->number),
                'pdf_url' => route('invoices.pdf', $invoice->number),
            ]);

        return Inertia::render('Admin/Invoices/Index', [
            'invoices' => $invoices,
            'filters' => $filters,
            'summary' => $request->user()->isOwner()
                ? [
                    'total' => (int) (clone $query)->sum('total'),
                    'paid' => (int) (clone $query)->sum('paid_amount'),
                    'outstanding' => (int) (clone $query)->sum('remaining_amount'),
                ]
                : null,
        ]);
    }
}
