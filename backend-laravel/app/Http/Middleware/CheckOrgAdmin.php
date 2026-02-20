<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckOrgAdmin
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

        if ($team = $request->route('team')) {
            $organizationId = is_object($team) ? $team->organization_id : null;
        }

        if (!$organizationId) {
            $organization = $request->route('organization');
            $organizationId = is_object($organization) ? $organization->id : (is_numeric($organization) ? (int) $organization : null);
        }

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

        if ($user->is_org_admin($organizationId)) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Você não tem permissão para fazer isso.'
        ], 403);
    }
}
