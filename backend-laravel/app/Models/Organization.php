<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    protected $fillable = [
        'name',
        'password',
        'description',
        'active'
    ];

    protected $hidden = ['password'];

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
}
