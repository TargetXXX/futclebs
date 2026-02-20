<?php

class MatchCommentService
{
    public function create($match, $player, array $data)
    {
        return $match->comments()->create([
            'player_id' => $player->id,
            'content' => $data['content']
        ]);
    }

    public function delete($comment): void
    {
        $comment->delete();
    }
}
