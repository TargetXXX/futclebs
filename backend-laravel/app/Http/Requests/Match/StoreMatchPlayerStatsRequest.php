<?php

namespace App\Http\Requests\Match;

use Illuminate\Foundation\Http\FormRequest;

class StoreMatchPlayerStatsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'goals' => ['sometimes', 'integer', 'min:0'],
            'assists' => ['sometimes', 'integer', 'min:0'],
            'minutes_played' => ['sometimes', 'integer', 'min:0', 'max:120'],
            'yellow_cards' => ['sometimes', 'integer', 'min:0'],
            'red_cards' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}