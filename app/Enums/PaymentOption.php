<?php

namespace App\Enums;

enum PaymentOption: string
{
    case Full = 'full';
    case Dp = 'dp';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
