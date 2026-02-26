<?php

namespace App\Services;

use App\Models\MatchModel;
use App\Models\Player;
use App\Models\PlayerVote;
use Illuminate\Validation\ValidationException;

class PlayerVoteService
{
    public function create(MatchModel $match, Player $user, array $data): PlayerVote
    {
        if ($match->status !== 'finished') {
            throw ValidationException::withMessages([
                'match' => 'A votação só é liberada após o encerramento da partida.',
            ]);
        }

        if ((int) $data['target_player_id'] === (int) $user->id) {
            throw ValidationException::withMessages([
                'target_player_id' => 'Você não pode votar em si mesmo.',
            ]);
        }

        $isVoterOnMatch = $match->players()->where('player_id', $user->id)->exists();
        $isTargetOnMatch = $match->players()->where('player_id', $data['target_player_id'])->exists();

        if (!$isVoterOnMatch || !$isTargetOnMatch) {
            throw ValidationException::withMessages([
                'match' => 'A votação é permitida apenas entre participantes da partida.',
            ]);
        }

        $voterTeam = $this->resolvePlayerTeam($match, (int) $user->id);
        $targetTeam = $this->resolvePlayerTeam($match, (int) $data['target_player_id']);

        if ($voterTeam === null || $targetTeam === null) {
            throw ValidationException::withMessages([
                'match' => 'Defina as escalações dos dois times antes de liberar a votação.',
            ]);
        }

        if ($voterTeam !== $targetTeam) {
            throw ValidationException::withMessages([
                'target_player_id' => 'Você só pode votar em jogadores do seu próprio time.',
            ]);
        }

        return PlayerVote::updateOrCreate(
            [
                'match_id' => $match->id,
                'organization_id' => $match->organization_id,
                'voter_id' => $user->id,
                'target_player_id' => $data['target_player_id'],
            ],
            $data
        );
    }

    public function statusByMatch(MatchModel $match): array
    {
        $players = $match->players()
            ->withPivot(['team'])
            ->get(['players.id', 'players.name']);

        $playersByTeam = $players
            ->groupBy(fn ($player) => (int) ($player->pivot->team ?? 0))
            ->filter(fn ($group, $team) => in_array((int) $team, [1, 2], true));

        $participantIds = $players->pluck('id')->values();

        $votes = PlayerVote::query()
            ->where('match_id', $match->id)
            ->whereIn('voter_id', $participantIds)
            ->whereIn('target_player_id', $participantIds)
            ->get(['voter_id', 'target_player_id']);

        $votesByVoter = $votes->groupBy('voter_id')->map(fn ($group) => $group->pluck('target_player_id')->unique()->values());

        $requiredVotesByPlayer = $players->mapWithKeys(function ($player) use ($playersByTeam) {
            $team = (int) ($player->pivot->team ?? 0);
            $required = max(($playersByTeam->get($team)?->count() ?? 0) - 1, 0);
            return [$player->id => $required];
        });

        return [
            'match_id' => $match->id,
            'players_count' => $participantIds->count(),
            'players' => $players->map(function ($player) use ($votesByVoter, $requiredVotesByPlayer) {
                $givenVotes = $votesByVoter->get($player->id, collect());
                $requiredVotes = (int) ($requiredVotesByPlayer->get($player->id) ?? 0);
                return [
                    'id' => $player->id,
                    'name' => $player->name,
                    'team' => (int) ($player->pivot->team ?? 0),
                    'required_votes' => $requiredVotes,
                    'votes_given' => $givenVotes->count(),
                    'votes_missing' => max($requiredVotes - $givenVotes->count(), 0),
                ];
            })->values(),
            'is_fully_voted' => $players->every(function ($player) use ($votesByVoter, $requiredVotesByPlayer) {
                $requiredVotes = (int) ($requiredVotesByPlayer->get($player->id) ?? 0);
                if ($requiredVotes === 0) {
                    return true;
                }

                return $votesByVoter->get($player->id, collect())->count() >= $requiredVotes;
            }),
        ];
    }

    private function resolvePlayerTeam(MatchModel $match, int $playerId): ?int
    {
        $teamFromPivot = $match->players()
            ->where('player_id', $playerId)
            ->value('match_players.team');

        if (in_array((int) $teamFromPivot, [1, 2], true)) {
            return (int) $teamFromPivot;
        }

        $result = $match->result;
        if (!$result) {
            return null;
        }

        $teamA = collect($result->players_team_a ?? [])->map(fn ($id) => (int) $id);
        $teamB = collect($result->players_team_b ?? [])->map(fn ($id) => (int) $id);

        if ($teamA->contains($playerId)) {
            return 1;
        }

        if ($teamB->contains($playerId)) {
            return 2;
        }

        return null;
    }
}
