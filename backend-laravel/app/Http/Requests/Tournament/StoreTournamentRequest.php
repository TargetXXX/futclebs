<?php

namespace App\Http\Requests\Tournament;

use Illuminate\Foundation\Http\FormRequest;

class StoreTournamentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'organization_id' => ['required', 'exists:organizations,id'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:league,knockout'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],

            'teams' => ['sometimes', 'array', 'min:2'],
            'teams.*' => ['required_with:teams', 'string', 'min:2', 'max:255', 'distinct:ignore_case'],
        ];
    }
}
