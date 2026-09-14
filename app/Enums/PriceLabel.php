<?php

namespace App\Enums;

enum PriceLabel: string
{
    case OffPeak = 'off_peak';
    case Peak = 'peak';
    case Weekend = 'weekend';
    case Custom = 'custom';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
