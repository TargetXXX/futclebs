import React, { useEffect, useMemo, useState } from 'react';
import { api, PlayerStats } from '../../../services/axios.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  isAdmin: boolean;
}

interface MatchPlayer {
  id: number;
  name: string;
  stats: PlayerStats | null;
  is_goalkeeper?: boolean;
}

type TeamTarget = 'A' | 'B' | 'NONE';
type SortMode = 'overall-desc' | 'overall-asc' | 'name-asc';

const normalizeIds = (ids: Array<number | string>) =>
  ids.map((id) => Number(id)).filter((id) => Number.isFinite(id));

const statRows = [
  { key: 'velocidade', label: 'VEL' },
  { key: 'finalizacao', label: 'FIN' },
  { key: 'passe', label: 'PAS' },
  { key: 'drible', label: 'DRI' },
  { key: 'defesa', label: 'DEF' },
  { key: 'fisico', label: 'FIS' },
  { key: 'esportividade', label: 'ESP' },
] as const;

const getOverall = (player?: MatchPlayer) => player?.stats?.overall ?? 0;

export const TeamSortingModal: React.FC<Props> = ({ isOpen, onClose, matchId, isAdmin }) => {
  const [players, setPlayers] = useState<MatchPlayer[]>([]);
  const [teamAIds, setTeamAIds] = useState<number[]>([]);
  const [teamBIds, setTeamBIds] = useState<number[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<MatchPlayer | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('overall-desc');

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !matchId) return;

      setLoading(true);
      try {
        const [{ data: playersData }, { data: matchData }] = await Promise.all([
          api.get(`/matches/${matchId}/players`),
          api.get(`/matches/${matchId}`),
        ]);

        const payload = (playersData?.data ?? playersData ?? []) as MatchPlayer[];
        setPlayers(payload);

        const result = (matchData?.data ?? matchData)?.result;
        const normalizedA = normalizeIds(result?.players_team_a ?? []);
        const normalizedB = normalizeIds((result?.players_team_b ?? []).filter((id: number) => !normalizedA.includes(Number(id))));

        setTeamAIds(normalizedA);
        setTeamBIds(normalizedB);
        setFeedback(null);
      } catch {
        setPlayers([]);
        setTeamAIds([]);
        setTeamBIds([]);
        setFeedback('Não foi possível carregar a escalação.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, matchId]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedPlayer) {
        setSelectedPlayer(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, selectedPlayer]);

  const sortPlayers = (list: MatchPlayer[]) => {
    const next = [...list];

    if (sortMode === 'name-asc') {
      return next.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortMode === 'overall-asc') {
      return next.sort((a, b) => getOverall(a) - getOverall(b));
    }

    return next.sort((a, b) => getOverall(b) - getOverall(a));
  };

  const searchedPlayers = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = !term ? players : players.filter((player) => player.name.toLowerCase().includes(term));
    return sortPlayers(filtered);
  }, [players, search, sortMode]);

  const teamAPlayers = useMemo(
    () => searchedPlayers.filter((player) => teamAIds.includes(player.id)),
    [searchedPlayers, teamAIds],
  );
  const teamBPlayers = useMemo(
    () => searchedPlayers.filter((player) => teamBIds.includes(player.id)),
    [searchedPlayers, teamBIds],
  );
  const unassignedPlayers = useMemo(
    () => searchedPlayers.filter((player) => !teamAIds.includes(player.id) && !teamBIds.includes(player.id)),
    [searchedPlayers, teamAIds, teamBIds],
  );

  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );

  const teamASum = useMemo(
    () => teamAIds.reduce((total, id) => total + getOverall(playersById.get(id)), 0),
    [playersById, teamAIds],
  );
  const teamBSum = useMemo(
    () => teamBIds.reduce((total, id) => total + getOverall(playersById.get(id)), 0),
    [playersById, teamBIds],
  );
  const balanceDiff = Math.abs(teamASum - teamBSum);

  const movePlayer = (playerId: number, target: TeamTarget) => {
    setFeedback(null);
    setTeamAIds((prev) => prev.filter((id) => id !== playerId));
    setTeamBIds((prev) => prev.filter((id) => id !== playerId));

    if (target === 'A') {
      setTeamAIds((prev) => [...prev, playerId]);
    }

    if (target === 'B') {
      setTeamBIds((prev) => [...prev, playerId]);
    }
  };

  const autoBalance = () => {
    const sorted = [...players].sort((a, b) => getOverall(b) - getOverall(a));
    const nextA: number[] = [];
    const nextB: number[] = [];
    let sumA = 0;
    let sumB = 0;

    sorted.forEach((player) => {
      const overall = getOverall(player);
      if (sumA <= sumB) {
        nextA.push(player.id);
        sumA += overall;
      } else {
        nextB.push(player.id);
        sumB += overall;
      }
    });

    setTeamAIds(nextA);
    setTeamBIds(nextB);
    setFeedback('Times balanceados automaticamente por overall.');
  };

  const splitUnassigned = () => {
    if (unassignedPlayers.length === 0) {
      setFeedback('Não há jogadores sem time para distribuir.');
      return;
    }

    let nextA = [...teamAIds];
    let nextB = [...teamBIds];
    let sumA = teamASum;
    let sumB = teamBSum;

    unassignedPlayers.forEach((player) => {
      const overall = getOverall(player);
      if (sumA <= sumB) {
        nextA = [...nextA, player.id];
        sumA += overall;
      } else {
        nextB = [...nextB, player.id];
        sumB += overall;
      }
    });

    setTeamAIds(nextA);
    setTeamBIds(nextB);
    setFeedback('Jogadores sem time foram distribuídos automaticamente.');
  };

  const clearTeams = () => {
    setTeamAIds([]);
    setTeamBIds([]);
    setFeedback('Todos os jogadores voltaram para “Sem time”.');
  };

  const saveTeams = async () => {
    if (!isAdmin || !matchId) return;

    const normalizedA = normalizeIds(teamAIds);
    const normalizedB = normalizeIds(teamBIds.filter((id) => !normalizedA.includes(id)));

    if (normalizedA.length === 0 || normalizedB.length === 0) {
      setFeedback('Os dois times precisam ter ao menos 1 jogador.');
      return;
    }

    if (normalizedA.length + normalizedB.length < players.length) {
      setFeedback('Distribua todos os jogadores antes de salvar.');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/matches/${matchId}/result`, { players_team_a: normalizedA, players_team_b: normalizedB });
      setFeedback('Escalação salva com sucesso.');
    } catch {
      try {
        await api.post(`/matches/${matchId}/result`, { players_team_a: normalizedA, players_team_b: normalizedB });
        setFeedback('Escalação salva com sucesso.');
      } catch {
        setFeedback('Falha ao salvar os times.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4">
        <div className="w-full max-w-7xl max-h-[92vh] overflow-auto bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700 rounded-3xl p-5 md:p-6 shadow-2xl shadow-cyan-950/30">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h2 className="text-white font-black text-2xl tracking-tight">Escalação dinâmica</h2>
              <p className="text-slate-300 text-sm mt-1">Organize os jogadores, compare overalls e toque no card para abrir os atributos.</p>
            </div>

            <div className="flex gap-2">
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
              >
                <option value="overall-desc">Overall ↓</option>
                <option value="overall-asc">Overall ↑</option>
                <option value="name-asc">Nome A-Z</option>
              </select>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                placeholder="Buscar jogador"
              />
            </div>
          </div>

          <div className="mt-4 grid md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-emerald-600/30 bg-emerald-900/10 p-3">
              <div className="text-xs uppercase tracking-widest text-emerald-300">Time A</div>
              <div className="text-white text-lg font-bold">{teamAIds.length} jogadores</div>
              <div className="text-emerald-300 font-semibold">OVR total {teamASum}</div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
              <div className="text-xs uppercase tracking-widest text-slate-300">Equilíbrio</div>
              <div className="text-white text-lg font-bold">Diferença {balanceDiff}</div>
              <div className={`${balanceDiff <= 8 ? 'text-emerald-300' : 'text-amber-300'} font-semibold`}>
                {balanceDiff <= 8 ? 'Balanceamento bom' : 'Recomendado reequilibrar'}
              </div>
            </div>
            <div className="rounded-2xl border border-cyan-600/30 bg-cyan-900/10 p-3">
              <div className="text-xs uppercase tracking-widest text-cyan-300">Time B</div>
              <div className="text-white text-lg font-bold">{teamBIds.length} jogadores</div>
              <div className="text-cyan-300 font-semibold">OVR total {teamBSum}</div>
            </div>
          </div>

          {isAdmin && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={autoBalance} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Balancear por OVR</button>
              <button onClick={splitUnassigned} className="rounded-xl bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-500">Distribuir sem time</button>
              <button onClick={clearTeams} className="rounded-xl bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-600">Limpar times</button>
            </div>
          )}

          {feedback && <div className="mt-3 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100">{feedback}</div>}

          {loading ? (
            <p className="mt-4 text-slate-400">Carregando escalação...</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-3 mt-4">
              {[
                { title: 'Time A', playersList: teamAPlayers, accent: 'emerald' },
                { title: 'Sem time', playersList: unassignedPlayers, accent: 'slate' },
                { title: 'Time B', playersList: teamBPlayers, accent: 'cyan' },
              ].map((group) => (
                <div key={group.title} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">{group.title}</h3>
                    <span className="text-slate-400 text-xs">{group.playersList.length} jogadores</span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {group.playersList.length === 0 && <p className="text-slate-500 text-sm">Nenhum jogador.</p>}
                    {group.playersList.map((player) => (
                      <div key={`${group.title}-${player.id}`} className="rounded-xl bg-slate-800/80 p-2 border border-slate-700 hover:border-slate-500 transition-colors">
                        <button
                          onClick={() => setSelectedPlayer(player)}
                          className="w-full text-left flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-white">{player.name}</div>
                            <div className="text-xs text-slate-400">{player.is_goalkeeper ? 'Goleiro' : 'Linha'}</div>
                          </div>
                          <span className={`${group.accent === 'emerald' ? 'text-emerald-300' : group.accent === 'cyan' ? 'text-cyan-300' : 'text-slate-200'} font-black`}>
                            OVR {getOverall(player)}
                          </span>
                        </button>

                        {isAdmin && (
                          <div className="mt-2 flex gap-2">
                            <button onClick={() => movePlayer(player.id, 'A')} className="px-2 py-1 text-xs rounded bg-emerald-700/70 text-white hover:bg-emerald-600">Time A</button>
                            <button onClick={() => movePlayer(player.id, 'B')} className="px-2 py-1 text-xs rounded bg-cyan-700/70 text-white hover:bg-cyan-600">Time B</button>
                            <button onClick={() => movePlayer(player.id, 'NONE')} className="px-2 py-1 text-xs rounded bg-slate-700 text-white hover:bg-slate-600">Sem time</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            {isAdmin && (
              <button
                onClick={saveTeams}
                disabled={saving || loading}
                className="px-4 py-2 bg-emerald-600 rounded-xl text-white font-semibold disabled:opacity-50 hover:bg-emerald-500"
              >
                {saving ? 'Salvando...' : 'Salvar times'}
              </button>
            )}
            <button onClick={onClose} className="px-4 py-2 bg-slate-700 rounded-xl text-white font-semibold hover:bg-slate-600">Fechar</button>
          </div>
        </div>
      </div>

      {selectedPlayer && (
        <div className="fixed inset-0 z-[170] bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedPlayer(null)}>
          <div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700 rounded-2xl p-4" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">{selectedPlayer.name}</h3>
                <p className="text-xs text-slate-400">{selectedPlayer.is_goalkeeper ? 'Goleiro' : 'Jogador de linha'}</p>
              </div>
              <span className="text-emerald-300 font-black text-2xl">{getOverall(selectedPlayer)}</span>
            </div>

            <div className="mt-3 space-y-2">
              {statRows.map((row) => (
                <div key={row.key} className="rounded-lg bg-slate-800 px-3 py-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{row.label}</span>
                    <span className="text-white font-semibold">{selectedPlayer.stats?.[row.key] ?? 0}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded bg-slate-700">
                    <div
                      className="h-1.5 rounded bg-emerald-400"
                      style={{ width: `${Math.min(((selectedPlayer.stats?.[row.key] ?? 0) / 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setSelectedPlayer(null)} className="mt-4 w-full py-2 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-600">Fechar</button>
          </div>
        </div>
      )}
    </>
  );
};
