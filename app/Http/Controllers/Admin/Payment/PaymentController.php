<?php

namespace App\Http\Controllers\Admin\Payment;

use App\Enums\PaymentProvider;
use App\Enums\PaymentType;
use App\Enums\TransactionStatus;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Daftar seluruh transaksi pembayaran (Midtrans maupun pencatatan di venue).
 * Ringkasan nominal hanya dikirim ke owner.
 */
class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(TransactionStatus::class)],
            'provider' => ['nullable', Rule::enum(PaymentProvider::class)],
            'type' => ['nullable', Rule::enum(PaymentType::class)],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $query = Payment::query()
            ->with(['booking:id,code,customer_name,customer_email,customer_phone', 'recordedBy:id,name'])
            ->when($filters['search'] ?? null, fn (Builder $query, string $search) => $query->where(fn (Builder $query) => $query
                ->where('order_id', 'like', "%{$search}%")
                ->orWhere('transaction_id', 'like', "%{$search}%")
                ->orWhereHas('booking', fn (Builder $query) => $query
                    ->where('code', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_email', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', '%'.(User::normalizePhone($search) ?? $search).'%'))))
            ->when($filters['status'] ?? null, fn (Builder $query, string $status) => $query->where('status', $status))
            ->when($filters['provider'] ?? null, fn (Builder $query, string $provider) => $query->where('provider', $provider))
            ->when($filters['type'] ?? null, fn (Builder $query, string $type) => $query->where('type', $type))
            ->when($filters['date_from'] ?? null, fn (Builder $query, string $date) => $query->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn (Builder $query, string $date) => $query->whereDate('created_at', '<=', $date));

        $payments = (clone $query)
            ->latest()
            ->paginate(20, ['id', 'booking_id', 'order_id', 'type', 'provider', 'amount', 'status', 'payment_method', 'paid_at', 'expires_at', 'created_at', 'recorded_by'])
            ->withQueryString();

        return Inertia::render('Admin/Payments/Index', [
            'payments' => $payments,
            'filters' => $filters,
            // BR: nominal pemasukan hanya untuk owner.
            'summary' => $request->user()->isOwner()
                ? [
                    'settled' => (int) (clone $query)->settled()->sum('amount'),
                    'pending' => (int) (clone $query)->open()->sum('amount'),
                    'count' => (clone $query)->count(),
                ]
                : null,
        ]);
    }
}
