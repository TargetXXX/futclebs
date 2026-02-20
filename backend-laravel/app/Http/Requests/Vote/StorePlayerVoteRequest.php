<?php

namespace App\Http\Requests\Vote;

use Illuminate\Foundation\Http\FormRequest;

class StorePlayerVoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'target_player_id' => ['required', 'integer', 'exists:players,id'],

            'velocidade' => ['required', 'integer', 'min:0', 'max:10'],
            'finalizacao' => ['required', 'integer', 'min:0', 'max:10'],
            'passe' => ['required', 'integer', 'min:0', 'max:10'],
            'drible' => ['required', 'integer', 'min:0', 'max:10'],
            'defesa' => ['required', 'integer', 'min:0', 'max:10'],
            'fisico' => ['required', 'integer', 'min:0', 'max:10'],
        ];
    }
}
