<?php

namespace App\Enums;

enum CourtType: string
{
    case Indoor = 'indoor';
    case Outdoor = 'outdoor';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
