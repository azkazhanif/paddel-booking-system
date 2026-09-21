<?php

namespace App\Enums;

enum UserRole: string
{
    case Customer = 'customer';
    case Staff = 'staff';
    case Admin = 'admin';
    case Owner = 'owner';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Role yang dikelola lewat halaman Kelola User (bukan customer).
     *
     * @return list<string>
     */
    public static function internalValues(): array
    {
        return [self::Staff->value, self::Admin->value, self::Owner->value];
    }

    public function label(): string
    {
        return match ($this) {
            self::Customer => 'Customer',
            self::Staff => 'Staff',
            self::Admin => 'Admin',
            self::Owner => 'Owner',
        };
    }
}
