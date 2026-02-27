<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrganizationSeason extends Model
{
    protected $fillable = [
        'organization_id',
        'name',
        'starts_at',
        'ends_at',
        'is_active',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
