<?php

namespace App\Models;

use App\Enums\PlayerPosition;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Player extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'phone',
        'is_goalkeeper',
        'primary_position',
        'secondary_position',
        'avatar',
        'status',
        'email',
        'password',
        'birthdate',
        'gender',
        'verification_code',
        'code_sent_at',
        'is_verified',
        'is_admin',
        'is_active',
        'cpf',
        'username'
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'verification_code'
    ];

    protected $casts = [
        'birthdate' => 'date',
        'is_verified' => 'boolean',
        'is_goalkeeper' => 'boolean',
        'is_admin' => 'boolean',
        'is_active' => 'boolean',
        'primary_position' => PlayerPosition::class,
        'secondary_position' => PlayerPosition::class,
    ];


    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = bcrypt($value);
    }


    public function is_org_admin(int $organizationId): bool
    {
        return $this->organizations()
            ->where('organization_id', $organizationId)
            ->wherePivot('is_admin', true)
            ->exists();
    }

    public function teams()
    {
        return $this->belongsToMany(Team::class, 'team_players')
            ->withPivot(['is_captain'])
            ->withTimestamps();
    }



    public function organizations()
    {
        return $this->belongsToMany(Organization::class, 'organization_players')
            ->withPivot([
                'is_admin',
                'velocidade',
                'finalizacao',
                'passe',
                'drible',
                'defesa',
                'fisico',
                'esportividade',
                'overall'
            ])
            ->withTimestamps();
    }

    public function matches()
    {
        return $this->belongsToMany(MatchModel::class, 'match_players', 'player_id', 'match_id')
            ->withPivot(['is_goalkeeper', 'team', 'goals', 'assists', 'minutes_played', 'yellow_cards', 'red_cards'])
            ->withTimestamps();
    }

    public function votesGiven()
    {
        return $this->hasMany(PlayerVote::class, 'voter_id');
    }

    public function votesReceived()
    {
        return $this->hasMany(PlayerVote::class, 'target_player_id');
    }

    public function stats($organizationId)
    {
        return $this->organizations()
            ->where('organization_id', $organizationId)
            ->withPivot([
                'velocidade',
                'finalizacao',
                'passe',
                'drible',
                'defesa',
                'fisico',
                'esportividade',
                'overall'
            ])->first();

    }

    public function comments()
    {
        return $this->hasMany(MatchComment::class);
    }
}
