<?php

namespace App\Enums;

enum RefundStatus: string
{
    case None = 'none';
    case Requested = 'requested';
    case Processed = 'processed';
    case Rejected = 'rejected';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
