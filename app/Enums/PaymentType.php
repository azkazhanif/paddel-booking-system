<?php

namespace App\Enums;

enum PaymentType: string
{
    case Full = 'full';
    case Dp = 'dp';
    case Settlement = 'settlement';
    case Offline = 'offline';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
