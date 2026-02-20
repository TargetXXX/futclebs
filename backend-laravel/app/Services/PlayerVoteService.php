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
        $players = $match->players()->get(['players.id', 'players.name']);
        $participantIds = $players->pluck('id')->values();

        $votes = PlayerVote::query()
            ->where('match_id', $match->id)
            ->whereIn('voter_id', $participantIds)
            ->whereIn('target_player_id', $participantIds)
            ->get(['voter_id', 'target_player_id']);

        $votesByVoter = $votes->groupBy('voter_id')->map(fn ($group) => $group->pluck('target_player_id')->unique()->values());
        $requiredVotesPerPlayer = max($participantIds->count() - 1, 0);

        return [
            'match_id' => $match->id,
            'players_count' => $participantIds->count(),
            'required_votes_per_player' => $requiredVotesPerPlayer,
            'players' => $players->map(function ($player) use ($votesByVoter, $requiredVotesPerPlayer) {
                $givenVotes = $votesByVoter->get($player->id, collect());
                return [
                    'id' => $player->id,
                    'name' => $player->name,
                    'votes_given' => $givenVotes->count(),
                    'votes_missing' => max($requiredVotesPerPlayer - $givenVotes->count(), 0),
                ];
            })->values(),
            'is_fully_voted' => $requiredVotesPerPlayer === 0
                ? true
                : $players->every(function ($player) use ($votesByVoter, $requiredVotesPerPlayer) {
                    return $votesByVoter->get($player->id, collect())->count() >= $requiredVotesPerPlayer;
                }),
        ];
    }
}
