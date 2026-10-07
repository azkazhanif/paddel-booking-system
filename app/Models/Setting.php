<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    public const CREATED_AT = null;

    protected const CACHE_KEY = 'settings';

    protected $primaryKey = 'key';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'key',
        'value',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'array',
        ];
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $settings = Cache::rememberForever(self::CACHE_KEY, fn () => static::query()->pluck('value', 'key')->all());

        return array_key_exists($key, $settings) ? $settings[$key] : $default;
    }

    /**
     * Data venue yang dipakai hampir semua halaman publik & email.
     *
     * @return array<string, mixed>
     */
    public static function venue(): array
    {
        return [
            'name' => self::get('venue.name', 'PBS Padel Club'),
            'address' => self::get('venue.address', ''),
            'whatsapp' => self::get('venue.whatsapp', ''),
            'coordinates' => self::get('venue.coordinates', ['lat' => null, 'lng' => null]),
            'socials' => self::get('venue.socials', []),
        ];
    }

    public static function set(string $key, mixed $value): void
    {
        static::query()->updateOrCreate(['key' => $key], ['value' => $value]);

        Cache::forget(self::CACHE_KEY);
    }
}
