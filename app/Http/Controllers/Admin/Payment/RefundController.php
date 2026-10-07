<?php

namespace App\Http\Controllers\Admin\Payment;

use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Pencatatan refund. Dana dikembalikan manual oleh admin (transfer/tunai), di sini
 * hanya dicatat nominal dan statusnya supaya invoice & laporan ikut menyesuaikan.
 */
class RefundController extends Controller
{
    public function update(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in([RefundStatus::Requested->value, RefundStatus::Processed->value, RefundStatus::Rejected->value])],
            'amount' => ['required_if:status,processed', 'nullable', 'integer', 'min:1', 'max:'.max(1, $booking->paid_amount)],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $status = RefundStatus::from($validated['status']);

        if ($booking->paid_amount <= 0) {
            return back()->with('error', 'Belum ada pembayaran yang bisa direfund pada booking ini.');
        }

        DB::transaction(function () use ($booking, $validated, $status) {
            $locked = Booking::query()->lockForUpdate()->findOrFail($booking->id);
            $amount = $status === RefundStatus::Processed ? (int) $validated['amount'] : $locked->refund_amount;

            $locked->forceFill([
                'refund_status' => $status,
                'refund_amount' => $amount,
                'cancel_reason' => $validated['note'] ?? $locked->cancel_reason,
                'payment_status' => match (true) {
                    $status !== RefundStatus::Processed => $locked->payment_status,
                    $amount >= $locked->paid_amount => PaymentStatus::Refunded,
                    default => PaymentStatus::PartiallyRefunded,
                },
            ])->save();

            $locked->invoice?->syncFromBooking();
        });

        ActivityLog::record('payment.refunded', $booking, ['status' => $status->value, 'amount' => $validated['amount'] ?? null]);

        return back()->with('success', match ($status) {
            RefundStatus::Processed => 'Refund dicatat sebagai sudah diproses.',
            RefundStatus::Rejected => 'Pengajuan refund ditolak.',
            default => 'Refund ditandai menunggu proses.',
        });
    }
}
