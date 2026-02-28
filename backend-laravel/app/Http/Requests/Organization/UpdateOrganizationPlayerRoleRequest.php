<?php

namespace App\Http\Requests\Organization;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrganizationPlayerRoleRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'is_admin' => ['required', 'boolean'],
        ];
    }
}
