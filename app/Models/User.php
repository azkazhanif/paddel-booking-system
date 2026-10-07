<?php

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'avatar_path',
        'role',
        'is_blocked',
        'blocked_reason',
        'dp_suspended_until',
        'admin_notes',
        'password',
        'google_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'google_id',
        'admin_notes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'role' => UserRole::class,
            'is_blocked' => 'boolean',
            'email_verified_at' => 'datetime',
            'dp_suspended_until' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function payments(): HasManyThrough
    {
        return $this->hasManyThrough(Payment::class, Booking::class);
    }

    public function invoices(): HasManyThrough
    {
        return $this->hasManyThrough(Invoice::class, Booking::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function scopeCustomers(Builder $query): void
    {
        $query->where('role', UserRole::Customer);
    }

    public function scopeInternal(Builder $query): void
    {
        $query->whereIn('role', UserRole::internalValues());
    }

    public function hasRole(UserRole|string ...$roles): bool
    {
        $values = array_map(fn (UserRole|string $role) => $role instanceof UserRole ? $role->value : $role, $roles);

        return in_array($this->role?->value, $values, true);
    }

    public function isOwner(): bool
    {
        return $this->role === UserRole::Owner;
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    /**
     * Owner & admin sama-sama mengakses panel admin; perbedaannya ada di menu keuangan, pengaturan, dan kelola user.
     */
    public function canAccessAdmin(): bool
    {
        return $this->hasRole(UserRole::Owner, UserRole::Admin);
    }

    public function isStaff(): bool
    {
        return $this->role === UserRole::Staff;
    }

    /**
     * Normalisasi nomor WhatsApp ke format 62xxxxxxxxxx (0812… / +62 812… / 812… → 62812…).
     */
    public static function normalizePhone(?string $phone): ?string
    {
        $digits = preg_replace('/\D/', '', (string) $phone);

        return match (true) {
            $digits === '' => null,
            str_starts_with($digits, '62') => $digits,
            str_starts_with($digits, '0') => '62'.substr($digits, 1),
            str_starts_with($digits, '8') => '62'.$digits,
            default => $digits,
        };
    }

    /**
     * BR-DP1 & BR-DP8: member terverifikasi, tidak diblokir, dan akses DP tidak sedang dicabut.
     */
    public function canUseDp(): bool
    {
        return $this->hasVerifiedEmail()
            && ! $this->is_blocked
            && ($this->dp_suspended_until === null || $this->dp_suspended_until->isPast());
    }
}
