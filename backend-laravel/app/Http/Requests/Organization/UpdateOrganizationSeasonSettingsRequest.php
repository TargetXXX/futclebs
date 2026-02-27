<?php

namespace App\Http\Requests\Organization;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrganizationSeasonSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'seasons_enabled' => ['required', 'boolean'],
            'season_duration_days' => ['nullable', 'integer', 'min:7', 'max:365'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->boolean('seasons_enabled') && !$this->filled('season_duration_days')) {
                $validator->errors()->add('season_duration_days', 'A duração da temporada é obrigatória quando temporadas estão ativas.');
            }
        });
    }
}
