<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'uuid',
        'name',
        'email',
        'google_id',
        'avatar_url',
        'phone',
        'password',
        'role', // 'user', 'admin', 'spi'
        'status', // 'active', 'frozen'
        'email_verified_at',
        'locale',
        'theme',
        'last_login_at',
        'failed_logins',
        'locked_until',
        'must_change_password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'locked_until' => 'datetime',
            'password' => 'hashed',
            'must_change_password' => 'boolean',
            'failed_logins' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function ($user) {
            if (empty($user->uuid)) {
                $user->uuid = (string) Str::uuid();
            }
            if (empty($user->role)) {
                $user->role = 'user';
            }
            if (empty($user->status)) {
                $user->status = 'active';
            }
            if (empty($user->locale)) {
                $user->locale = 'id';
            }
            if (empty($user->theme)) {
                $user->theme = 'light';
            }
        });
    }

    public function isSpi(): bool
    {
        return $this->role === 'spi';
    }

    public function isAdmin(): bool
    {
        // SPI has full supervisory access to Admin features as well
        return in_array($this->role, ['admin', 'spi']);
    }

    public function isUser(): bool
    {
        return $this->role === 'user';
    }

    public function isFrozen(): bool
    {
        return $this->status === 'frozen';
    }

    public function isLocked(): bool
    {
        return $this->locked_until && $this->locked_until->isFuture();
    }

    public function addresses()
    {
        return $this->hasMany(Address::class);
    }

    public function defaultAddress()
    {
        return $this->hasOne(Address::class)->where('is_default', true);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function wishlists()
    {
        return $this->hasMany(Wishlist::class);
    }

    public function cart()
    {
        return $this->hasOne(Cart::class);
    }

    public function approvalsRequested()
    {
        return $this->hasMany(Approval::class, 'requester_id');
    }

    public function approvalsDecided()
    {
        return $this->hasMany(Approval::class, 'decider_id');
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class, 'actor_id');
    }

    public function auditFindingsAssigned()
    {
        return $this->hasMany(AuditFinding::class, 'assignee_id');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
}
