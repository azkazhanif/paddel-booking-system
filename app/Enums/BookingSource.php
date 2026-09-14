<?php

namespace App\Enums;

enum BookingSource: string
{
    case Online = 'online';
    case WalkIn = 'walk_in';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
