<?php
namespace App\Http\Requests\Organization;
use Illuminate\Foundation\Http\FormRequest;

class StoreOrganizationRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'password' => ['required', 'string', 'min:4'],
            'admin_player_id' => ['nullable', 'integer', 'exists:players,id'],
        ];
    }
}
