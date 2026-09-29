<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\PaymentLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Webhook Midtrans. Payload hanya dipercaya bila signature-nya sah, dan status
 * final tetap diambil ulang lewat Status API agar tidak bisa dipalsukan.
 */
class MidtransNotificationController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $payload = $request->all();
        $orderId = $payload['order_id'] ?? null;

        PaymentLog::create([
            'order_id' => (string) $orderId,
            'event' => 'notification',
            'payload' => $payload,
        ]);

        if (! Payment::midtransSignatureIsValid($payload)) {
            return response()->json(['message' => 'Invalid signature.'], 403);
        }

        $payment = Payment::query()->where('order_id', $orderId)->first();

        if (! $payment) {
            return response()->json(['message' => 'Unknown order.'], 404);
        }

        PaymentLog::query()->where('order_id', $orderId)->whereNull('payment_id')->update(['payment_id' => $payment->id]);

        DB::transaction(function () use ($payment) {
            $locked = Payment::query()->lockForUpdate()->findOrFail($payment->id);

            // Payload notifikasi sudah terverifikasi, tetapi status tetap dikonfirmasi
            // ulang ke Midtrans sebelum booking diubah.
            $locked->syncFromMidtrans();
        });

        return response()->json(['message' => 'OK']);
    }
}
