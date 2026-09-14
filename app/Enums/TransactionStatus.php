<?php

namespace App\Enums;

enum TransactionStatus: string
{
    case Pending = 'pending';
    case Settlement = 'settlement';
    case Expired = 'expired';
    case Failed = 'failed';
    case Refunded = 'refunded';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
