<?php
namespace App\Http\Requests\Organization;
use Illuminate\Foundation\Http\FormRequest;

class StoreOrganizationPlayerRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'player_id' => ['required', 'exists:players,id'],
        ];
    }
}
