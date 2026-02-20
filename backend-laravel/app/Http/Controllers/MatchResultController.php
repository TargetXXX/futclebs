<?php
namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use App\Http\Requests\MatchResult\StoreMatchResultRequest;
use App\Http\Requests\MatchResult\UpdateMatchResultRequest;
use App\Models\MatchModel;
use App\Services\MatchResultService;

class MatchResultController extends Controller
{
    public function __construct(
        private MatchResultService $service
    ) {
    }

    public function store(StoreMatchResultRequest $request, MatchModel $match)
    {
        $result = $this->service->create($match, $request->validated());

        return response()->json($result, 201);
    }

    public function update(UpdateMatchResultRequest $request, MatchModel $match)
    {
        $result = $this->service->update($match, $request->validated());

        return response()->json($result);
    }

    public function destroy(MatchModel $match)
    {
        $this->service->delete($match);

        return response()->json(['message' => 'Resultado removido']);
    }
}
