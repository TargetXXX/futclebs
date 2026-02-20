<?php
namespace App\Models;
use App\Models\Player;
use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    protected $fillable = [
        'tournament_id',
        'name',
        'logo',
        'description'
    ];

    public function tournament()
    {
        return $this->belongsTo(Tournament::class);
    }

    public function players()
    {
        return $this->belongsToMany(Player::class, 'team_players');
    }
}
