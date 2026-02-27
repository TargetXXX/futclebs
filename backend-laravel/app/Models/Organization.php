<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    protected $fillable = [
        'name',
        'password',
        'description',
        'active',
        'seasons_enabled',
        'season_duration_days',
    ];

    protected $hidden = ['password'];

    protected $casts = [
        'active' => 'boolean',
        'seasons_enabled' => 'boolean',
    ];

    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = bcrypt($value);
    }

    public function players()
    {
        return $this->belongsToMany(Player::class, 'organization_players')
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

    public function tournaments()
    {
        return $this->hasMany(Tournament::class);
    }

    public function matches()
    {
        return $this->hasMany(MatchModel::class);
    }

    public function seasons()
    {
        return $this->hasMany(OrganizationSeason::class);
    }
}
