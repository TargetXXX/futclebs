<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MatchResult extends Model
{
    protected $fillable = [
        'match_id',
        'organization_id',
        'tournament_id',
        'goals_team_a',
        'goals_team_b',
        'players_team_a',
        'players_team_b',
    ];

    protected $casts = [
        'players_team_a' => 'array',
        'players_team_b' => 'array',
    ];

    public function match()
    {
        return $this->belongsTo(MatchModel::class);
    }
}
