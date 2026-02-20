<?php
namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use App\Http\Requests\MatchComment\StoreMatchCommentRequest;
use App\Models\MatchModel;
use MatchComment;
use MatchCommentService;

class MatchCommentController extends Controller
{
    public function __construct(
        private MatchCommentService $service
    ) {
    }

    public function index(MatchModel $match)
    {
        return $match->comments()->with('player')->get();
    }

    public function store(StoreMatchCommentRequest $request, MatchModel $match)
    {
        $comment = $this->service->create(
            $match,
            $request->user(),
            $request->validated()
        );

        return response()->json($comment, 201);
    }

    public function destroy(MatchComment $comment)
    {
        if ($comment->player_id !== auth()->id()) {
            abort(403);
        }

        $this->service->delete($comment);

        return response()->json(['message' => 'Comentário removido']);
    }
}
