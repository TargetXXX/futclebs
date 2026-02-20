<?php

namespace App\Http\Requests\MatchComment;

use Illuminate\Foundation\Http\FormRequest;

class StoreMatchCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content' => ['required', 'string', 'max:1000'],
        ];
    }
}
