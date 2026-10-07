<?php

namespace App\Http\Controllers\Admin\Voucher;

use App\Enums\VoucherType;
use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Kelola kode voucher: diskon persen atau potongan tetap, dengan kuota, minimal
 * transaksi, dan masa berlaku.
 */
class VoucherController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'in:active,inactive,expired'],
        ]);

        $vouchers = Voucher::query()
            ->withCount('bookings')
            ->when($filters['search'] ?? null, fn (Builder $query, string $search) => $query->where('code', 'like', "%{$search}%"))
            ->when($filters['status'] ?? null, fn (Builder $query, string $status) => match ($status) {
                'active' => $query->where('is_active', true)->where(fn (Builder $query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now())),
                'inactive' => $query->where('is_active', false),
                default => $query->whereNotNull('ends_at')->where('ends_at', '<', now()),
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Vouchers/Index', [
            'vouchers' => $vouchers,
            'filters' => $filters,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Vouchers/Form', [
            'voucher' => null,
            'types' => $this->types(),
        ]);
    }

    public function store(Request $request)
    {
        Voucher::create($this->validated($request));

        return redirect()->route('admin.vouchers.index')->with('success', 'Voucher ditambahkan.');
    }

    public function edit(Voucher $voucher)
    {
        return Inertia::render('Admin/Vouchers/Form', [
            'voucher' => [
                ...$voucher->only(['id', 'code', 'value', 'max_discount', 'min_amount', 'quota', 'used_count', 'members_only', 'is_active']),
                'type' => $voucher->type->value,
                'starts_at' => $voucher->starts_at?->timezone(config('app.timezone'))->format('Y-m-d'),
                'ends_at' => $voucher->ends_at?->timezone(config('app.timezone'))->format('Y-m-d'),
            ],
            'types' => $this->types(),
        ]);
    }

    public function update(Request $request, Voucher $voucher)
    {
        $voucher->update($this->validated($request, $voucher));

        return redirect()->route('admin.vouchers.index')->with('success', 'Voucher diperbarui.');
    }

    public function destroy(Voucher $voucher)
    {
        $voucher->delete();

        return back()->with('success', 'Voucher dihapus.');
    }

    public function toggle(Voucher $voucher)
    {
        $voucher->update(['is_active' => ! $voucher->is_active]);

        return back()->with('success', $voucher->is_active ? 'Voucher diaktifkan.' : 'Voucher dinonaktifkan.');
    }

    /**
     * @return array<string, mixed>
     */
    protected function validated(Request $request, ?Voucher $voucher = null): array
    {
        // Kode selalu disimpan kapital; input huruf kecil tetap diterima.
        $request->merge(['code' => strtoupper(trim((string) $request->input('code')))]);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:30', 'regex:/^[A-Z0-9-]+$/', Rule::unique('vouchers', 'code')->ignore($voucher?->id)],
            'type' => ['required', Rule::enum(VoucherType::class)],
            'value' => ['required', 'integer', 'min:1', $request->input('type') === VoucherType::Percent->value ? 'max:100' : 'max:10000000'],
            'max_discount' => ['nullable', 'integer', 'min:0', 'max:10000000'],
            'min_amount' => ['required', 'integer', 'min:0', 'max:10000000'],
            'quota' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'members_only' => ['required', 'boolean'],
            'starts_at' => ['nullable', 'date_format:Y-m-d'],
            'ends_at' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:starts_at'],
            'is_active' => ['required', 'boolean'],
        ]);

        return [
            ...$validated,
            'starts_at' => $validated['starts_at'] ? $validated['starts_at'].' 00:00:00' : null,
            'ends_at' => $validated['ends_at'] ? $validated['ends_at'].' 23:59:59' : null,
        ];
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    protected function types(): array
    {
        return array_map(fn (VoucherType $type) => [
            'value' => $type->value,
            'label' => $type === VoucherType::Percent ? 'Diskon persen (%)' : 'Potongan tetap (Rp)',
        ], VoucherType::cases());
    }
}
