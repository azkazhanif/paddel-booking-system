<?php

namespace App\Http\Controllers\Payment;

use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Http\Controllers\Booking\BookingController;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Setting;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

/**
 * Pembayaran booking online lewat Midtrans Snap: bayar penuh, DP 30% (khusus member),
 * dan pelunasan sisa tagihan. Status akhir tetap datang dari webhook/Status API.
 */
class PaymentController extends Controller
{
    /**
     * Buat transaksi Snap dan kembalikan tokennya untuk dibuka di popup Snap.
     */
    public function store(Request $request, Booking $booking): JsonResponse
    {
        Gate::authorize('pay', $booking);

        $validated = $request->validate([
            'payment_option' => ['required', 'in:full,dp'],
        ]);

        if ($booking->hasExpired()) {
            Booking::expireStale();

            return response()->json(['message' => 'Batas waktu pembayaran booking ini sudah lewat.'], 422);
        }

        if (! $booking->isPayable()) {
            return response()->json(['message' => 'Booking ini tidak bisa dibayar lagi.'], 422);
        }

        if (! Payment::midtransConfigured()) {
            return response()->json(['message' => 'Pembayaran online belum aktif. Hubungi admin venue.'], 503);
        }

        // BR-G2 & BR-DP1: DP hanya untuk member yang memenuhi syarat, dicek ulang di server.
        $wantsDp = $validated['payment_option'] === 'dp'
            && $booking->payment_status === PaymentStatus::Unpaid
            && $booking->canPayDp();

        if ($validated['payment_option'] === 'dp' && ! $wantsDp) {
            return response()->json(['message' => 'Opsi DP tidak tersedia untuk booking ini. Silakan bayar penuh.'], 422);
        }

        [$type, $amount] = DB::transaction(function () use ($booking, $wantsDp) {
            $locked = Booking::query()->lockForUpdate()->findOrFail($booking->id);

            if ($wantsDp) {
                $locked->applyDpOption();

                return [PaymentType::Dp, $locked->dp_amount];
            }

            // Sisa tagihan setelah DP dibayar dihitung sebagai pelunasan.
            return $locked->payment_status === PaymentStatus::DpPaid
                ? [PaymentType::Settlement, $locked->remaining_amount]
                : [PaymentType::Full, $locked->remaining_amount];
        });

        $booking->refresh();

        if ($amount < 1) {
            return response()->json(['message' => 'Tidak ada tagihan yang perlu dibayar.'], 422);
        }

        $payment = $booking->openSnapPayment($type, $amount);

        if (! $payment) {
            try {
                $payment = Payment::chargeSnap($booking, $amount, $type, $this->expiryMinutes($booking));
            } catch (RequestException $exception) {
                report($exception);

                return response()->json([
                    'message' => 'Midtrans menolak permintaan pembayaran: '
                        .($exception->response->json('error_messages.0') ?? $exception->getMessage()),
                ], 502);
            }
        }

        return response()->json([
            'token' => $payment->snap_token,
            'redirect_url' => $payment->snap_redirect_url,
            'amount' => $payment->amount,
            'type' => $payment->type->value,
            'status_url' => route('booking.status', $booking->code),
        ]);
    }

    /**
     * Halaman status pembayaran: lunas, DP terbayar, menunggu, gagal, atau kedaluwarsa.
     */
    public function status(Request $request, Booking $booking)
    {
        Gate::authorize('view', $booking);

        // Tarik status terbaru agar pembayaran tetap terdeteksi walau webhook belum sampai
        // (mis. saat berjalan di localhost yang tidak bisa dihubungi Midtrans).
        $booking->latestPayment?->syncFromMidtrans();

        if ($booking->refresh()->hasExpired()) {
            Booking::expireStale();
            $booking->refresh();
        }

        $payment = $booking->payments()->latest()->first();

        return Inertia::render('Booking/Status', [
            'booking' => BookingController::bookingPayload($booking) + [
                'guest_url' => $booking->isGuest() ? $booking->guestUrl() : null,
                'can_settle' => $booking->payment_status === PaymentStatus::DpPaid && $booking->isPayable(),
            ],
            'payment' => $payment?->only(['order_id', 'type', 'amount', 'status', 'payment_method', 'paid_at']),
            'invoice' => $this->invoicePayload($booking),
            'venue' => [
                'name' => Setting::get('venue.name', 'PBS Padel Club'),
                'address' => Setting::get('venue.address', ''),
                'whatsapp' => Setting::get('venue.whatsapp', ''),
            ],
            'snap' => [
                'enabled' => Payment::midtransConfigured() && filled(config('midtrans.client_key')),
                'clientKey' => config('midtrans.client_key'),
                'isProduction' => (bool) config('midtrans.is_production'),
            ],
        ]);
    }

    /**
     * Tautan invoice: member lewat akunnya, tamu lewat link signed dari email.
     *
     * @return array{number: string, url: string, pdf_url: string}|null
     */
    public static function invoicePayload(Booking $booking): ?array
    {
        $invoice = $booking->invoice;

        if (! $invoice) {
            return null;
        }

        return [
            'number' => $invoice->number,
            'url' => $booking->isGuest() ? $invoice->signedUrl() : route('invoices.show', $invoice->number),
            'pdf_url' => $booking->isGuest() ? $invoice->signedPdfUrl() : route('invoices.pdf', $invoice->number),
        ];
    }

    /**
     * Masa berlaku transaksi Snap: tidak boleh melewati batas hold booking yang masih pending.
     */
    protected function expiryMinutes(Booking $booking): int
    {
        $default = max(1, (int) config('midtrans.expiry_minutes', 15));

        if (! $booking->expires_at) {
            return $default;
        }

        return max(1, min($default, (int) floor(now()->diffInMinutes($booking->expires_at, false))));
    }
}
