<?php

namespace App\Enums;

enum BlockReason: string
{
    case Maintenance = 'maintenance';
    case Event = 'event';
    case Tournament = 'tournament';
    case Other = 'other';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
