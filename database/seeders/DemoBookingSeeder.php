<?php

namespace Database\Seeders;

use App\Enums\BookingSource;
use App\Enums\BookingStatus;
use App\Enums\CustomerType;
use App\Enums\PaymentOption;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\TransactionStatus;
use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Data contoh untuk mencoba panel admin (member, guest, booking 45 hari ke belakang & 7 hari ke depan).
 * Hanya dijalankan di luar production.
 */
class DemoBookingSeeder extends Seeder
{
    protected const METHODS = ['qris', 'gopay', 'shopeepay', 'bca_va', 'bni_va', 'credit_card'];

    public function run(): void
    {
        if (Booking::query()->exists()) {
            $this->command?->warn('Booking sudah ada, DemoBookingSeeder dilewati.');

            return;
        }

        mt_srand(2026);

        $members = collect([
            ['Rina Maharani', 'rina@example.com'],
            ['Andre Wijaya', 'andre@example.com'],
            ['Salsa Putri', 'salsa@example.com'],
            ['Dimas Pratama', 'dimas@example.com'],
            ['Kevin Halim', 'kevin@example.com'],
            ['Nadia Kusuma', 'nadia@example.com'],
            ['Bayu Saputra', 'bayu@example.com'],
            ['Citra Lestari', 'citra@example.com'],
        ])->map(function (array $member, int $index) {
            $user = User::query()->updateOrCreate(['email' => $member[1]], [
                'name' => $member[0],
                'phone' => '62812000000'.str_pad((string) $index, 2, '0', STR_PAD_LEFT),
                'role' => UserRole::Customer,
                'password' => 'password',
            ]);

            $user->forceFill(['email_verified_at' => now(), 'created_at' => now()->subDays(mt_rand(0, 120))])->save();

            return $user;
        });

        $guests = [
            ['Yoga Firmansyah', 'yoga@example.com'],
            ['Maya Anggraini', 'maya@example.com'],
            ['Rizky Ramadhan', 'rizky@example.com'],
            ['Laras Wulandari', 'laras@example.com'],
        ];

        $courts = Court::query()->with('priceRules')->active()->get();
        $admin = User::query()->where('role', UserRole::Admin)->first();
        $today = CarbonImmutable::now(Booking::TIMEZONE)->startOfDay();

        if ($courts->isEmpty()) {
            return;
        }

        DB::transaction(function () use ($members, $guests, $courts, $admin, $today) {
            for ($offset = -45; $offset <= 7; $offset++) {
                $date = $today->addDays($offset);
                $usedSlots = [];

                // Akhir pekan & jam malam lebih ramai
                $count = mt_rand(4, $date->isWeekend() ? 16 : 10);

                for ($i = 0; $i < $count; $i++) {
                    $court = $courts->random();
                    $hour = mt_rand(0, 9) < 6 ? mt_rand(16, 21) : mt_rand(6, 15);
                    $key = "{$court->id}-{$hour}";

                    if (isset($usedSlots[$key])) {
                        continue;
                    }

                    $usedSlots[$key] = true;
                    $isMember = mt_rand(0, 9) < 6;
                    $member = $isMember ? $members->random() : null;
                    [$name, $email] = $member ? [$member->name, $member->email] : $guests[array_rand($guests)];

                    $this->createBooking($court, $date, $hour, $member, $name, $email, $admin, $offset);
                }
            }
        });
    }

    protected function createBooking(Court $court, CarbonImmutable $date, int $hour, ?User $member, string $name, string $email, ?User $admin, int $offset): void
    {
        $startTime = sprintf('%02d:00:00', $hour);
        $price = $court->priceAt($date, $startTime);
        $isPast = $offset < 0;
        $useDp = $member && mt_rand(0, 9) < 4;
        $roll = mt_rand(1, 100);

        $status = match (true) {
            $isPast && $roll <= 8 => BookingStatus::Cancelled,
            $isPast && $roll <= 11 => BookingStatus::NoShow,
            $isPast => BookingStatus::Completed,
            $offset === 0 && $hour < (int) now(Booking::TIMEZONE)->format('H') => BookingStatus::CheckedIn,
            $roll <= 10 => BookingStatus::Pending,
            default => BookingStatus::Confirmed,
        };

        $dpAmount = $useDp ? (int) ceil($price * 30 / 100 / 1000) * 1000 : 0;

        // Booking mendatang dengan DP sebagian belum dilunasi → masuk sisa tagihan
        $settled = match (true) {
            $status === BookingStatus::Pending => 0,
            $status === BookingStatus::Cancelled => $useDp ? $dpAmount : $price,
            $useDp && ! $isPast && mt_rand(0, 1) === 0 => $dpAmount,
            default => $price,
        };

        $booking = Booking::query()->create([
            'code' => Booking::generateCode(),
            'user_id' => $member?->id,
            'court_id' => $court->id,
            'customer_type' => $member ? CustomerType::Member : CustomerType::Guest,
            'customer_name' => $name,
            'customer_email' => $email,
            'customer_phone' => $member?->phone ?? '6281300000'.mt_rand(100, 999),
            'date' => $date->toDateString(),
            'start_time' => $startTime,
            'end_time' => sprintf('%02d:00:00', $hour + 1),
            'subtotal' => $price,
            'total' => $price,
            'payment_option' => $useDp ? PaymentOption::Dp : PaymentOption::Full,
            'dp_percentage' => $useDp ? 30 : null,
            'dp_amount' => $dpAmount,
            'paid_amount' => $settled,
            'remaining_amount' => $price - $settled,
            'settlement_due_at' => $useDp ? $date->setTime($hour, 0)->subHours(3)->utc() : null,
            'status' => $status,
            'payment_status' => match (true) {
                $settled >= $price => PaymentStatus::Paid,
                $settled > 0 => PaymentStatus::DpPaid,
                default => PaymentStatus::Unpaid,
            },
            'source' => mt_rand(0, 9) === 0 ? BookingSource::WalkIn : BookingSource::Online,
            'expires_at' => $status === BookingStatus::Pending ? now()->addMinutes(15) : null,
            'confirmed_at' => $settled > 0 ? $date->subDays(mt_rand(1, 5))->utc() : null,
            'paid_at' => $settled >= $price ? $date->subDays(mt_rand(0, 3))->utc() : null,
            'checked_in_at' => in_array($status, [BookingStatus::CheckedIn, BookingStatus::Completed], true) ? $date->setTime($hour, 0)->subMinutes(10)->utc() : null,
            'checked_in_by' => in_array($status, [BookingStatus::CheckedIn, BookingStatus::Completed], true) ? $admin?->id : null,
            'cancelled_at' => $status === BookingStatus::Cancelled ? $date->subDay()->utc() : null,
            'cancel_reason' => $status === BookingStatus::Cancelled ? 'Customer berhalangan hadir' : null,
        ]);

        $booking->items()->create([
            'court_id' => $court->id,
            'date' => $date->toDateString(),
            'start_time' => $startTime,
            'end_time' => $booking->end_time,
            'price' => $price,
            'price_label' => $court->priceLabelAt($date, $startTime)?->value,
            'is_active' => $status === BookingStatus::Cancelled ? null : true,
        ]);

        if ($status === BookingStatus::Pending) {
            $this->createPayment($booking, $useDp ? PaymentType::Dp : PaymentType::Full, $useDp ? $dpAmount : $price, TransactionStatus::Pending, null);

            return;
        }

        $paidAt = $date->subDays(mt_rand(1, 5))->setTime(mt_rand(8, 22), mt_rand(0, 59));

        if ($useDp) {
            $this->createPayment($booking, PaymentType::Dp, $dpAmount, TransactionStatus::Settlement, $paidAt);

            if ($settled >= $price) {
                $this->createPayment($booking, PaymentType::Settlement, $price - $dpAmount, TransactionStatus::Settlement, $paidAt->addDay()->min($date));
            }

            return;
        }

        $this->createPayment($booking, PaymentType::Full, $price, TransactionStatus::Settlement, $paidAt);
    }

    protected function createPayment(Booking $booking, PaymentType $type, int $amount, TransactionStatus $status, ?CarbonImmutable $paidAt): void
    {
        $offline = $booking->source === BookingSource::WalkIn;

        $booking->payments()->create([
            'type' => $offline ? PaymentType::Offline : $type,
            'provider' => $offline ? PaymentProvider::Cash : PaymentProvider::Midtrans,
            'order_id' => $booking->code.'-'.Str::upper(Str::random(6)),
            'amount' => $amount,
            'status' => $status,
            'payment_method' => $offline ? null : self::METHODS[array_rand(self::METHODS)],
            'paid_at' => $paidAt?->utc(),
            'expires_at' => $status === TransactionStatus::Pending ? now()->addMinutes(15) : null,
        ]);
    }
}
