<?php

namespace App\Enums;

enum CustomerType: string
{
    case Guest = 'guest';
    case Member = 'member';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
