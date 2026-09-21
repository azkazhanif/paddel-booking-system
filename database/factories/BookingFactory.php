<?php

namespace Database\Factories;

use App\Enums\BookingStatus;
use App\Enums\CustomerType;
use App\Enums\PaymentOption;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Booking satu slot. Slot (booking_items) dibuat otomatis mengikuti tanggal & jam booking.
 *
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    public function definition(): array
    {
        $hour = fake()->unique()->numberBetween(6, 22);

        return [
            'code' => Booking::generateCode(),
            'court_id' => Court::factory(),
            'customer_type' => CustomerType::Guest,
            'customer_name' => fake()->name(),
            'customer_email' => fake()->unique()->safeEmail(),
            'customer_phone' => '62812'.fake()->numerify('#######'),
            'date' => now(Booking::TIMEZONE)->addDays(2)->toDateString(),
            'start_time' => sprintf('%02d:00:00', $hour),
            'end_time' => sprintf('%02d:00:00', $hour + 1),
            'subtotal' => 300000,
            'total' => 300000,
            'payment_option' => PaymentOption::Full,
            'paid_amount' => 300000,
            'remaining_amount' => 0,
            'status' => BookingStatus::Confirmed,
            'payment_status' => PaymentStatus::Paid,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Booking $booking) {
            $booking->items()->create([
                'court_id' => $booking->court_id,
                'date' => $booking->date->toDateString(),
                'start_time' => $booking->start_time,
                'end_time' => $booking->end_time,
                'price' => $booking->total,
                'is_active' => in_array($booking->status, [BookingStatus::Cancelled, BookingStatus::Expired], true) ? null : true,
            ]);
        });
    }

    public function forMember(User $user): static
    {
        return $this->state(fn () => [
            'user_id' => $user->id,
            'customer_type' => CustomerType::Member,
            'customer_name' => $user->name,
            'customer_email' => $user->email,
        ]);
    }

    public function today(): static
    {
        return $this->state(fn () => ['date' => now(Booking::TIMEZONE)->toDateString()]);
    }

    public function dpPaid(): static
    {
        return $this->state(fn () => [
            'payment_option' => PaymentOption::Dp,
            'dp_percentage' => 30,
            'dp_amount' => 90000,
            'paid_amount' => 90000,
            'remaining_amount' => 210000,
            'payment_status' => PaymentStatus::DpPaid,
        ]);
    }

    public function status(BookingStatus $status): static
    {
        return $this->state(fn () => ['status' => $status]);
    }
}
