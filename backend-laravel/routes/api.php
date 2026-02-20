<?php

use App\Http\Requests\Match\MatchPlayerController;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\OrganizationPlayerController;
use App\Http\Controllers\TournamentController;
use App\Http\Controllers\StandingController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\MatchResultController;
use App\Http\Controllers\MatchCommentController;
use App\Http\Controllers\PlayerVoteController;
use App\Http\Controllers\TeamController;

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {

    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

});


/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | ME CONTEXT
    |--------------------------------------------------------------------------
    */

    Route::get('/me/organizations', [OrganizationController::class, 'index']);

    Route::post(
        '/me/organizations/{organization}/join',
        [OrganizationController::class, 'join']
    );


    /*
    |--------------------------------------------------------------------------
    | PLAYERS
    |--------------------------------------------------------------------------
    */
    Route::get('/players/{phone}', [PlayerController::class, 'get']);
    Route::put('/players/{player}', [PlayerController::class, 'update']);
    Route::delete('/players/{player}', [PlayerController::class, 'destroy']);


    /*
    |--------------------------------------------------------------------------
    | ORGANIZATIONS (GLOBAL)
    |--------------------------------------------------------------------------
    */

    Route::get('/organizations', [OrganizationController::class, 'all']);

    Route::post('/organizations', [OrganizationController::class, 'store']);

    Route::get(
        '/organizations/{organization}/players',
        [OrganizationPlayerController::class, 'index']
    );
    Route::get(
        '/organizations/{organization}',
        [OrganizationController::class, 'show']
    );
    /*
    |--------------------------------------------------------------------------
    | ORGANIZATION - MEMBER ONLY
    |--------------------------------------------------------------------------
    */

    Route::middleware('org.member')->group(function () {


        /*
        |--------------------------------------------------------------------------
        | TOURNAMENTS
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/organizations/{organization}/tournaments',
            [TournamentController::class, 'index']
        );

        Route::post('/tournaments', [TournamentController::class, 'store']);
        Route::get('/tournaments/{tournament}', [TournamentController::class, 'show']);
        Route::put('/tournaments/{tournament}', [TournamentController::class, 'update']);
        Route::delete('/tournaments/{tournament}', [TournamentController::class, 'destroy']);

        Route::get(
            '/tournaments/{tournament}/standings',
            [StandingController::class, 'index']
        );


        /*
        |--------------------------------------------------------------------------
        | MATCHES
        |--------------------------------------------------------------------------
        */

        Route::post('/matches', [MatchController::class, 'store']);
        Route::get('/matches/{match}', [MatchController::class, 'show']);

        /*
        |--------------------------------------------------------------------------
        | MATCH RESULT
        |--------------------------------------------------------------------------
        */

        Route::post('/matches/{match}/result', [MatchResultController::class, 'store']);
        Route::put('/matches/{match}/result', [MatchResultController::class, 'update']);
        Route::delete('/matches/{match}/result', [MatchResultController::class, 'destroy']);

        /*
       |--------------------------------------------------------------------------
       | MATCH RESULT
       |--------------------------------------------------------------------------
       */

        Route::get('/matches/{match}/players', [MatchPlayerController::class, 'index']);
        Route::get('/matches/{match}/players/{player}', [MatchPlayerController::class, 'show']);

        /*
        |--------------------------------------------------------------------------
        | MATCH COMMENTS
        |--------------------------------------------------------------------------
        */

        Route::get('/matches/{match}/comments', [MatchCommentController::class, 'index']);
        Route::post('/matches/{match}/comments', [MatchCommentController::class, 'store']);
        Route::delete('/comments/{comment}', [MatchCommentController::class, 'destroy']);

        /*
        |--------------------------------------------------------------------------
        | PLAYER VOTES
        |--------------------------------------------------------------------------
        */

        Route::post('/matches/{match}/votes', [PlayerVoteController::class, 'store']);


        /*
        |--------------------------------------------------------------------------
        | ADMIN ONLY (ORG ADMIN)
        |--------------------------------------------------------------------------
        */






        Route::middleware('org.admin')->group(function () {



            // Alterar senha da organização
            Route::put(
                '/organizations/{organization}/password',
                [OrganizationController::class, 'updatePassword']
            );

            // Adicionar membro
            Route::post(
                '/organizations/{organization}/players',
                [OrganizationPlayerController::class, 'store']
            );

            // Remover membro
            Route::delete(
                '/organizations/{organization}/players/{player}',
                [OrganizationPlayerController::class, 'destroy']
            );

            // Atualizar stats do player na organização
            Route::put(
                '/organizations/{organization}/players/{player}/stats',
                [OrganizationPlayerController::class, 'updateStats']
            );

            // Atualizar estatísticas do jogador na partida
            Route::put('/matches/{match}/players/{player}/stats', [MatchPlayerController::class, 'updateStats']);

            /*
            |--------------------------------------------------------------------------
            | TEAMS
            |--------------------------------------------------------------------------
            */

            Route::post('/teams', [TeamController::class, 'store']);
            Route::put('/teams/{team}', [TeamController::class, 'update']);
            Route::delete('/teams/{team}', [TeamController::class, 'destroy']);
        });
    });
});
