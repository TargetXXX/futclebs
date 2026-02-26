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

        if ($match = $request->route('match')) {
            $organizationId = is_object($match) ? $match->organization_id : null;
        }

        if (!$organizationId && ($tournament = $request->route('tournament'))) {
            $organizationId = is_object($tournament) ? $tournament->organization_id : null;
        }

        if (!$organizationId && ($team = $request->route('team'))) {
            $organizationId = is_object($team) ? $team?->tournament?->organization_id : null;
        }

        if (!$organizationId && $request->filled('tournament_id')) {
            $organizationId = (int) \App\Models\Tournament::query()
                ->whereKey((int) $request->input('tournament_id'))
                ->value('organization_id');
        }

        if (!$organizationId && $request->filled('team_id')) {
            $organizationId = (int) \App\Models\Team::query()
                ->whereKey((int) $request->input('team_id'))
                ->join('tournaments', 'teams.tournament_id', '=', 'tournaments.id')
                ->value('tournaments.organization_id');
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
