<?php

namespace App\Enums;

enum PaymentProvider: string
{
    case Midtrans = 'midtrans';
    case Cash = 'cash';
    case VenueQris = 'venue_qris';
    case BankTransfer = 'bank_transfer';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
