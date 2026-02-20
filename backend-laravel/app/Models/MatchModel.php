<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MatchModel extends Model
{
    use HasFactory;

    protected $table = 'matches';

    protected $fillable = [
        'organization_id',
        'tournament_id',
        'name',
        'match_date',
        'min_ovr',
        'description',
        'player_limit',
        'is_private',
        'password',
        'status',
        'team_a_id',
        'team_b_id',
    ];

    protected $hidden = [
        'password'
    ];

    protected $casts = [
        'match_date' => 'datetime',
        'is_private' => 'boolean',
        'min_ovr' => 'integer',
        'player_limit' => 'integer',
    ];

    /*
    |--------------------------------------------------------------------------
    | RELACIONAMENTOS
    |--------------------------------------------------------------------------
    */

    /**
     * Organização dona do jogo
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Torneio (se existir)
     */
    public function tournament()
    {
        return $this->belongsTo(Tournament::class);
    }

    /**
     * Time A (modo torneio)
     */
    public function teamA()
    {
        return $this->belongsTo(Team::class, 'team_a_id');
    }

    /**
     * Time B (modo torneio)
     */
    public function teamB()
    {
        return $this->belongsTo(Team::class, 'team_b_id');
    }

    /**
     * Players do jogo (modo casual)
     */
    public function players()
    {
        return $this->belongsToMany(Player::class, 'match_players')
            ->withPivot(['is_goalkeeper', 'team', 'goals', 'assists', 'minutes_played', 'yellow_cards', 'red_cards'])
            ->withTimestamps();
    }

    /**
     * Resultado do jogo
     */
    public function result()
    {
        return $this->hasOne(MatchResult::class, 'match_id');
    }

    /**
     * Comentários
     */
    public function comments()
    {
        return $this->hasMany(MatchComment::class, 'match_id');
    }



    /**
     * Verifica se é jogo de torneio
     */
    public function isTournamentMatch(): bool
    {
        return !is_null($this->tournament_id);
    }

    /**
     * Verifica se é jogo casual
     */
    public function isCasualMatch(): bool
    {
        return is_null($this->tournament_id);
    }

    /**
     * Verifica se já tem resultado
     */
    public function hasResult(): bool
    {
        return $this->result()->exists();
    }
}
