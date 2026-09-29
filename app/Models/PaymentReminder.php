<?php

namespace App\Models;

use App\Enums\ReminderChannel;
use App\Enums\ReminderType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentReminder extends Model
{
    protected $fillable = [
        'booking_id',
        'type',
        'channel',
        'sent_at',
    ];

    protected $attributes = [
        'channel' => 'email',
    ];

    protected function casts(): array
    {
        return [
            'type' => ReminderType::class,
            'channel' => ReminderChannel::class,
            'sent_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public static function whatsappConfigured(): bool
    {
        return config('whatsapp.driver') === 'fonnte' && filled(config('whatsapp.token'));
    }

    /**
     * Kirim pesan WhatsApp sekali saja per (booking, tipe) — unique index tabel ini
     * yang menjaga agar scheduler tidak mengirim pesan ganda. Baris pencatat dihapus
     * lagi bila gateway gagal, supaya percobaan berikutnya tetap jalan.
     */
    public static function sendWhatsapp(Booking $booking, ReminderType $type, string $message): bool
    {
        if (! $booking->customer_phone) {
            return false;
        }

        $reminder = $booking->reminders()->firstOrCreate(
            ['type' => $type, 'channel' => ReminderChannel::Whatsapp],
            ['sent_at' => now()],
        );

        if (! $reminder->wasRecentlyCreated) {
            return false;
        }

        // Driver "log" dipakai saat gateway belum dipasang: pesan tetap tercatat di log.
        if (! self::whatsappConfigured()) {
            Log::info('WhatsApp (driver log)', ['to' => $booking->customer_phone, 'message' => $message]);

            return true;
        }

        $response = Http::withHeaders(['Authorization' => (string) config('whatsapp.token')])
            ->asForm()
            ->timeout(20)
            ->post(rtrim((string) config('whatsapp.base_url'), '/').'/send', array_filter([
                'target' => $booking->customer_phone,
                'message' => $message,
                'countryCode' => '62',
                'device' => config('whatsapp.device'),
            ]));

        if (! $response->successful() || ($response->json('status') === false)) {
            Log::warning('Gagal mengirim WhatsApp', ['booking' => $booking->code, 'response' => $response->body()]);
            $reminder->delete();

            return false;
        }

        return true;
    }
}
