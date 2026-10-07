<?php

namespace App\Http\Controllers\Booking;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

/**
 * Pasang & lepas kode voucher di halaman checkout. Nilai potongan selalu dihitung
 * ulang di server, dan voucher hanya bisa diubah selama booking belum dibayar.
 */
class VoucherController extends Controller
{
    public function store(Request $request, Booking $booking)
    {
        Gate::authorize('pay', $booking);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:30'],
        ]);

        $this->guardEditable($booking);

        $voucher = Voucher::query()->where('code', strtoupper(trim($validated['code'])))->first();

        if (! $voucher) {
            throw ValidationException::withMessages(['code' => 'Kode voucher tidak ditemukan.']);
        }

        if ($reason = $voucher->rejectionFor($booking)) {
            throw ValidationException::withMessages(['code' => $reason]);
        }

        DB::transaction(function () use ($booking, $voucher) {
            $locked = Booking::query()->lockForUpdate()->findOrFail($booking->id);

            $locked->applyVoucher($voucher);
        });

        return back()->with('success', "Voucher {$voucher->code} dipakai: {$voucher->label()}.");
    }

    public function destroy(Request $request, Booking $booking)
    {
        Gate::authorize('pay', $booking);

        $this->guardEditable($booking);

        DB::transaction(function () use ($booking) {
            Booking::query()->lockForUpdate()->findOrFail($booking->id)->applyVoucher(null);
        });

        return back()->with('success', 'Voucher dilepas.');
    }

    /**
     * Voucher hanya boleh diubah selama booking masih menunggu pembayaran.
     */
    protected function guardEditable(Booking $booking): void
    {
        if ($booking->paid_amount > 0 || ! $booking->isPayable()) {
            throw ValidationException::withMessages(['code' => 'Voucher tidak bisa diubah setelah pembayaran dimulai.']);
        }
    }
}
