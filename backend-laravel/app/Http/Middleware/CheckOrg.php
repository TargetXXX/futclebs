<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckOrg
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();



        if (!$user)
            return response()->json(['message' => 'Não autenticado.'], 401);

        if ($user->is_admin)
            return $next($request);

        $organizationId = null;

        if ($tournament = $request->route('tournament'))
            $organizationId = $tournament->organization_id;


        if ($match = $request->route('match'))
            $organizationId = $match->organization_id;

        if (!$organizationId)
            $organizationId = $request->input('organization_id');


        if (!$organizationId) {
            return response()->json([
                'message' => 'Organização não identificada.'
            ], 403);
        }

        $belongsToOrganization = $user->organizations()
            ->where('organizations.id', $organizationId)
            ->exists();

        if (!$belongsToOrganization) {
            return response()->json([
                'message' => 'Você não pertence a esta organização.'
            ], 403);
        }

        return $next($request);
    }
}
