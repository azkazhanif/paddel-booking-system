<?php

namespace App\Models;

use App\Enums\BookingStatus;
use App\Enums\InvoiceStatus;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class Invoice extends Model
{
    protected $fillable = [
        'booking_id',
        'number',
        'status',
        'billed_name',
        'billed_email',
        'billed_phone',
        'subtotal',
        'discount',
        'service_fee',
        'total',
        'paid_amount',
        'remaining_amount',
        'issued_at',
        'paid_at',
        'pdf_path',
        'last_sent_at',
    ];

    protected $attributes = [
        'status' => 'unpaid',
    ];

    protected function casts(): array
    {
        return [
            'status' => InvoiceStatus::class,
            'subtotal' => 'integer',
            'discount' => 'integer',
            'service_fee' => 'integer',
            'total' => 'integer',
            'paid_amount' => 'integer',
            'remaining_amount' => 'integer',
            'issued_at' => 'datetime',
            'paid_at' => 'datetime',
            'last_sent_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * Terbitkan invoice untuk sebuah booking, atau segarkan yang sudah ada.
     * Dipanggil saat booking dibuat dan setiap kali ada pembayaran masuk.
     */
    public static function issueFor(Booking $booking): self
    {
        return DB::transaction(function () use ($booking) {
            $invoice = $booking->invoice()->lockForUpdate()->first();

            if ($invoice) {
                $invoice->syncFromBooking();

                return $invoice;
            }

            return $booking->invoice()->create([
                'number' => self::nextNumber(),
                'billed_name' => $booking->customer_name,
                'billed_email' => $booking->customer_email ?? '',
                'billed_phone' => $booking->customer_phone,
                'subtotal' => (int) $booking->subtotal,
                'discount' => (int) $booking->discount,
                'service_fee' => (int) $booking->service_fee,
                'total' => (int) $booking->total,
                'paid_amount' => (int) $booking->paid_amount,
                'remaining_amount' => (int) $booking->remaining_amount,
                'status' => self::statusFor($booking),
                'paid_at' => $booking->paid_at,
                'issued_at' => now(),
            ]);
        });
    }

    /**
     * Samakan nominal & status invoice dengan kondisi booking terkini (I-4).
     */
    public function syncFromBooking(): void
    {
        $booking = $this->booking;

        $this->forceFill([
            'subtotal' => (int) $booking->subtotal,
            'discount' => (int) $booking->discount,
            'service_fee' => (int) $booking->service_fee,
            'total' => (int) $booking->total,
            'paid_amount' => (int) $booking->paid_amount,
            'remaining_amount' => (int) $booking->remaining_amount,
            'status' => self::statusFor($booking),
            'paid_at' => $booking->paid_at,
            // PDF lama tidak lagi mencerminkan nominal terbaru.
            'pdf_path' => null,
        ])->save();

        if ($this->getOriginal('pdf_path')) {
            Storage::delete($this->getOriginal('pdf_path'));
        }
    }

    protected static function statusFor(Booking $booking): InvoiceStatus
    {
        return match (true) {
            in_array($booking->status, [BookingStatus::Cancelled, BookingStatus::Expired], true) && $booking->paid_amount === 0 => InvoiceStatus::Void,
            $booking->paid_amount >= $booking->total => InvoiceStatus::Paid,
            $booking->paid_amount > 0 => InvoiceStatus::Partial,
            default => InvoiceStatus::Unpaid,
        };
    }

    /**
     * Nama file unduhan: INV-PBS-2026-10-000123.pdf
     */
    public function fileName(): string
    {
        return str_replace('/', '-', $this->number).'.pdf';
    }

    /**
     * Link invoice untuk tamu (tanpa akun), berlaku 30 hari.
     */
    public function signedUrl(): string
    {
        return URL::temporarySignedRoute('invoices.show', now()->addDays(30), ['invoice' => $this->number]);
    }

    public function signedPdfUrl(): string
    {
        return URL::temporarySignedRoute('invoices.pdf', now()->addDays(30), ['invoice' => $this->number]);
    }

    /**
     * Isi PDF invoice. Hasilnya disimpan agar lampiran email & unduhan berikutnya
     * tidak perlu dirender ulang.
     */
    public function pdfContents(): string
    {
        if ($this->pdf_path && Storage::exists($this->pdf_path)) {
            return Storage::get($this->pdf_path);
        }

        $this->loadMissing(['booking.court:id,name', 'booking.items', 'booking.payments']);

        $contents = Pdf::loadView('invoices.pdf', [
            'invoice' => $this,
            'booking' => $this->booking,
            'venue' => [
                'name' => Setting::get('invoice.company_name', Setting::get('venue.name', 'PBS Padel Club')),
                'address' => Setting::get('venue.address', ''),
                'whatsapp' => Setting::get('venue.whatsapp', ''),
                'tax_id' => Setting::get('invoice.tax_id'),
                'note' => Setting::get('invoice.footer_note', ''),
            ],
        ])->setPaper('a4')->output();

        $path = 'invoices/'.Str::of($this->fileName())->prepend($this->id.'-');
        Storage::put($path, $contents);
        $this->forceFill(['pdf_path' => $path])->save();

        return $contents;
    }

    /**
     * Nomor berikutnya, format INV/PBS/YYYY/MM/000123.
     * Panggil di dalam DB::transaction(); unique index `number` tetap menjadi pengaman terakhir.
     */
    public static function nextNumber(): string
    {
        $prefix = 'INV/PBS/'.now(Booking::TIMEZONE)->format('Y/m').'/';

        $last = static::query()
            ->where('number', 'like', $prefix.'%')
            ->orderByDesc('number')
            ->lockForUpdate()
            ->value('number');

        $sequence = $last ? (int) substr($last, strlen($prefix)) + 1 : 1;

        return $prefix.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
    }
}
