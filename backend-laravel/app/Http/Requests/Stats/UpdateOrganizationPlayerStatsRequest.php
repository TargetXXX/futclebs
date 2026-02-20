<?php

namespace App\Http\Requests\Stats;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrganizationPlayerStatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'velocidade' => ['required', 'integer', 'min:0', 'max:100'],
            'finalizacao' => ['required', 'integer', 'min:0', 'max:100'],
            'passe' => ['required', 'integer', 'min:0', 'max:100'],
            'drible' => ['required', 'integer', 'min:0', 'max:100'],
            'defesa' => ['required', 'integer', 'min:0', 'max:100'],
            'fisico' => ['required', 'integer', 'min:0', 'max:100'],
            'overall' => ['required', 'integer', 'min:0', 'max:100'],
        ];
    }
}
