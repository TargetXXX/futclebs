<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrganizationPlayerSeasonOverall extends Model
{
    protected $fillable = [
        'organization_id',
        'player_id',
        'organization_season_id',
        'season_reference',
        'overall',
        'recorded_at',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
    ];

    public function season()
    {
        return $this->belongsTo(OrganizationSeason::class, 'organization_season_id');
    }
}
