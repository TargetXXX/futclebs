<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlayerVote extends Model
{
    protected $fillable = [
        'match_id',
        'organization_id',
        'voter_id',
        'target_player_id',
        'velocidade',
        'finalizacao',
        'passe',
        'drible',
        'defesa',
        'fisico',
    ];

    public function match()
    {
        return $this->belongsTo(MatchModel::class);
    }

    public function voter()
    {
        return $this->belongsTo(Player::class, 'voter_id');
    }

    public function target()
    {
        return $this->belongsTo(Player::class, 'target_player_id');
    }
}
