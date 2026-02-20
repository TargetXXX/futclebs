<?php

use App\Models\MatchModel;
use Illuminate\Database\Eloquent\Model;
class MatchResult extends Model
{
    protected $primaryKey = 'match_id';
    public $incrementing = false;

    protected $fillable = [
        'match_id',
        'goals_team_a',
        'goals_team_b',
        'players_team_a',
        'players_team_b'
    ];

    protected $casts = [
        'players_team_a' => 'array',
        'players_team_b' => 'array'
    ];

    public function match()
    {
        return $this->belongsTo(MatchModel::class);
    }
}