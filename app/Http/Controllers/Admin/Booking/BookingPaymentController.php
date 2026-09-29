<?php

namespace App\Http\Controllers\Admin\Booking;

use App\Enums\BookingStatus;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Pembayaran di tempat: QRIS Midtrans yang dipindai customer dari layar admin,
 * atau pencatatan pembayaran offline (tunai / QRIS mesin venue / transfer).
 */
class BookingPaymentController extends Controller
{
    public function show(Request $request, Booking $booking)
    {
        $booking->loadMissing('court:id,name');
        $payment = $booking->openQrisPayment();

        // Polling halaman ini sekaligus menarik status terbaru, jadi pembayaran tetap
        // terdeteksi walau webhook belum sampai (mis. saat jalan di localhost).
        $payment?->syncFromMidtrans();

        $error = null;

        if (! $payment && $booking->remaining_amount > 0 && $booking->status === BookingStatus::Pending) {
            [$payment, $error] = $this->issueQris($booking, $request->user()->id);
        }

        $booking->refresh();

        return Inertia::render('Admin/Bookings/Payment', [
            'booking' => $booking->only([
                'id', 'code', 'customer_name', 'date', 'start_time', 'end_time',
                'total', 'paid_amount', 'remaining_amount', 'status', 'payment_status',
            ]) + ['court' => $booking->court?->only(['id', 'name'])],
            'payment' => $payment ? [
                ...$payment->only(['id', 'order_id', 'amount', 'status', 'expires_at']),
                'qr_url' => $payment->qrUrl(),
            ] : null,
            'error' => $error,
        ]);
    }

    /**
     * Buat QR baru (mis. QR lama kedaluwarsa atau gagal dipindai).
     */
    public function update(Request $request, Booking $booking)
    {
        if ($booking->remaining_amount <= 0) {
            return back()->with('error', 'Booking ini sudah lunas.');
        }

        [, $error] = $this->issueQris($booking, $request->user()->id);

        return $error
            ? back()->with('error', $error)
            : redirect()->route('admin.bookings.payment', $booking)->with('success', 'QRIS baru dibuat.');
    }

    /**
     * Catat pembayaran yang diterima langsung di venue.
     */
    public function store(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'amount' => ['required', 'integer', 'min:1', 'max:'.max(1, $booking->remaining_amount)],
            'provider' => ['required', Rule::in([PaymentProvider::Cash->value, PaymentProvider::VenueQris->value, PaymentProvider::BankTransfer->value])],
        ]);

        if ($booking->remaining_amount <= 0) {
            return back()->with('error', 'Booking ini sudah lunas.');
        }

        if (in_array($booking->status, [BookingStatus::Cancelled, BookingStatus::Expired], true)) {
            return back()->with('error', 'Booking ini sudah tidak aktif.');
        }

        DB::transaction(function () use ($booking, $validated, $request) {
            $locked = Booking::query()->lockForUpdate()->findOrFail($booking->id);

            $locked->recordOfflinePayment(
                (int) $validated['amount'],
                PaymentProvider::from($validated['provider']),
                $locked->payment_status === PaymentStatus::Unpaid ? PaymentType::Offline : PaymentType::Settlement,
                $request->user()->id,
            );
        });

        return redirect()->route('admin.bookings.show', $booking)->with('success', 'Pembayaran dicatat.');
    }

    /**
     * @return array{0: Payment|null, 1: string|null}
     */
    protected function issueQris(Booking $booking, int $recordedBy): array
    {
        if (! Payment::midtransConfigured()) {
            return [null, 'Midtrans belum dikonfigurasi. Isi MIDTRANS_SERVER_KEY & MIDTRANS_CLIENT_KEY di .env.'];
        }

        try {
            return [Payment::chargeQris($booking, $booking->remaining_amount, PaymentType::Full, $recordedBy), null];
        } catch (RequestException $exception) {
            report($exception);

            return [null, 'Midtrans menolak permintaan QRIS: '.($exception->response->json('status_message') ?? $exception->getMessage())];
        }
    }
}
