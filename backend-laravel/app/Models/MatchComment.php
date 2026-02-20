<?php
namespace App\Models;
use App\Models\MatchModel;
use App\Models\Player;
use Illuminate\Database\Eloquent\Model;

class MatchComment extends Model
{
    protected $fillable = [
        'match_id',
        'player_id',
        'content'
    ];

    public function match()
    {
        return $this->belongsTo(MatchModel::class);
    }

    public function player()
    {
        return $this->belongsTo(Player::class);
    }
}
