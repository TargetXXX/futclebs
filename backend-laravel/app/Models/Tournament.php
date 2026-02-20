<?php

namespace App\Models;

use App\Models\MatchModel;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Model;

class Tournament extends Model
{
    protected $fillable = [
        'organization_id',
        'name',
        'type',
        'start_date',
        'end_date',
        'status'
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function teams()
    {
        return $this->hasMany(Team::class);
    }

    public function matches()
    {
        return $this->hasMany(MatchModel::class);
    }

    public function standings()
    {
        return $this->hasMany(Standing::class);
    }
}
