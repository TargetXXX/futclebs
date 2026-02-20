<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Standing extends Model
{
    protected $fillable = [
        'tournament_id',
        'team_id',
        'played',
        'wins',
        'draws',
        'losses',
        'goals_for',
        'goals_against',
        'goal_difference',
        'points'
    ];

    public function tournament()
    {
        return $this->belongsTo(Tournament::class);
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }
}
