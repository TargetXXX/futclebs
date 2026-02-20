<?php

namespace App\Enums;

enum PlayerPosition: string
{


    case GOALKEEPER = 'GOLEIRO';
    case DEFENDER = 'DEFENSOR';
    case MIDFIELDER = 'MEIO CAMPO';
    case STRIKER = 'ATACANTE';


    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
