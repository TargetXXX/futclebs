import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/services/axios";

type MatchStatus = "open" | "in_progress" | "finished";
type DashboardTab = "open" | "pending" | "finished" | "ranking";
type TournamentType = "league" | "knockout";

interface MatchData {
  id: number;
  name?: string;
  match_date: string;
  status: MatchStatus;
  tournament_id?: number | null;
  players_count?: number;
  has_pending_votes?: boolean;
}

interface TournamentData {
  id: number;
  name: string;
  type?: TournamentType;
  start_date?: string | null;
  end_date?: string | null;
  matches?: MatchData[];
}

interface OrganizationPlayer {
  id: number;
  name: string;
  avatar?: string | null;
  primary_position?: string | null;
  goals_total?: number;
  assists_total?: number;
  pivot?: {
    is_admin?: boolean;
    overall?: number;
  };
}

interface OrganizationData {
  id: number;
  name: string;
  description?: string;
  players?: OrganizationPlayer[];
}

interface AuthUser {
  id: number;
  name: string;
}

const tabs: { key: DashboardTab; label: string }[] = [
  { key: "open", label: "Abertas" },
  { key: "pending", label: "Votar" },
  { key: "finished", label: "Histórico" },
  { key: "ranking", label: "Ranking" },
];

export default function OrganizationDashboard() {
  const navigate = useNavigate();
  const { orgId } = useParams();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>("open");
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [tournaments, setTournaments] = useState<TournamentData[]>([]);

  const [isCreateMatchOpen, setIsCreateMatchOpen] = useState(false);
  const [isCreateTournamentOpen, setIsCreateTournamentOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adminMatchId, setAdminMatchId] = useState<number | null>(null);

  const [newMatchDate, setNewMatchDate] = useState("");
  const [newMatchName, setNewMatchName] = useState("Pelada Futclebs");
  const [newMatchTournamentId, setNewMatchTournamentId] = useState<string>("none");

  const [newTournamentName, setNewTournamentName] = useState("");
  const [newTournamentType, setNewTournamentType] = useState<TournamentType>("league");
  const [newTournamentStartDate, setNewTournamentStartDate] = useState("");

  const [rankingSearch, setRankingSearch] = useState("");
  const [rankingPositionFilter, setRankingPositionFilter] = useState("all");

  const fetchDashboardData = async () => {
    if (!orgId) return;

    setLoading(true);
    try {
      const [orgResponse, meResponse, tournamentsResponse, matchesResponse] = await Promise.all([
        api.get(`/organizations/${orgId}`),
        api.get("/auth/me"),
        api.get(`/organizations/${orgId}/tournaments`),
        api.get(`/organizations/${orgId}/matches`),
      ]);

      const orgPayload = orgResponse.data?.data ?? orgResponse.data;
      const mePayload = meResponse.data?.data ?? meResponse.data;
      const tournamentsPayload = tournamentsResponse.data?.data ?? tournamentsResponse.data ?? [];
      const matchesPayload = matchesResponse.data?.data ?? matchesResponse.data ?? [];

      setOrganization(orgPayload);
      setUser(mePayload);
      setTournaments(tournamentsPayload as TournamentData[]);

      const finishedMatches = (matchesPayload as MatchData[]).filter((match) => match.status === "finished");

      const voteStatusEntries = await Promise.all(
        finishedMatches.map(async (match) => {
          try {
            const { data } = await api.get(`/matches/${match.id}/votes/status`);
            return [match.id, !Boolean(data?.is_fully_voted)] as const;
          } catch {
            return [match.id, false] as const;
          }
        })
      );

      const pendingByMatchId = new Map<number, boolean>(voteStatusEntries);

      const normalizedMatches = (matchesPayload as MatchData[]).map((match) => ({
        ...match,
        has_pending_votes: pendingByMatchId.get(match.id) ?? false,
      }));

      setMatches(normalizedMatches);
    } catch (fetchError) {
      console.error("Erro ao carregar dashboard da organização", fetchError);
      setOrganization(null);
      setMatches([]);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [orgId]);

  const userOnOrg = useMemo(
    () => organization?.players?.find((player) => player.id === user?.id),
    [organization?.players, user?.id]
  );

  const userOverall = userOnOrg?.pivot?.overall ?? 0;
  const isAdmin = Boolean(userOnOrg?.pivot?.is_admin);

  const openMatches = matches.filter((match) => match.status === "open" || match.status === "in_progress");
  const finishedMatches = matches.filter((match) => match.status === "finished");

  const rankingPlayers = useMemo(() => {
    const players = [...(organization?.players ?? [])];

    return players
      .filter((player) => {
        const matchesSearch = player.name.toLowerCase().includes(rankingSearch.toLowerCase());
        const matchesPosition =
          rankingPositionFilter === "all" ||
          (player.primary_position ?? "Linha").toLowerCase() === rankingPositionFilter.toLowerCase();

        return matchesSearch && matchesPosition;
      })
      .sort((a, b) => (b.pivot?.overall ?? 0) - (a.pivot?.overall ?? 0));
  }, [organization?.players, rankingSearch, rankingPositionFilter]);

  const topThreePlayers = rankingPlayers.slice(0, 3);
  const restOfRanking = rankingPlayers.slice(3);

  const topScorers = useMemo(
    () => [...(organization?.players ?? [])].sort((a, b) => (b.goals_total ?? 0) - (a.goals_total ?? 0)).slice(0, 5),
    [organization?.players]
  );

  const topAssisters = useMemo(
    () => [...(organization?.players ?? [])].sort((a, b) => (b.assists_total ?? 0) - (a.assists_total ?? 0)).slice(0, 5),
    [organization?.players]
  );

  const pendingMatches = matches.filter((match) => match.status === "finished" && match.has_pending_votes);

  const content =
    activeTab === "open"
      ? openMatches
      : activeTab === "finished"
      ? finishedMatches
      : activeTab === "pending"
      ? pendingMatches
      : rankingPlayers;

  const submitCreateMatch = async (event: FormEvent) => {
    event.preventDefault();

    if (!orgId || !newMatchDate) {
      setError("Informe a data da partida.");
      return;
    }

    setIsBusy(true);
    setError(null);
    setFeedback(null);

    try {
      await api.post("/matches", {
        organization_id: Number(orgId),
        name: newMatchName.trim() || "Rachão Futclebs",
        match_date: newMatchDate,
        tournament_id: newMatchTournamentId === "none" ? null : Number(newMatchTournamentId),
      });

      setFeedback("Partida criada com sucesso.");
      setNewMatchDate("");
      setNewMatchTournamentId("none");
      setIsCreateMatchOpen(false);
      await fetchDashboardData();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message ?? "Não foi possível criar a partida.");
    } finally {
      setIsBusy(false);
    }
  };

  const submitCreateTournament = async (event: FormEvent) => {
    event.preventDefault();

    if (!orgId || !newTournamentName.trim()) {
      setError("Dê um nome para o torneio.");
      return;
    }

    setIsBusy(true);
    setError(null);
    setFeedback(null);

    try {
      await api.post("/tournaments", {
        organization_id: Number(orgId),
        name: newTournamentName.trim(),
        type: newTournamentType,
        start_date: newTournamentStartDate || null,
      });

      setFeedback("Torneio criado com sucesso.");
      setNewTournamentName("");
      setNewTournamentStartDate("");
      setIsCreateTournamentOpen(false);
      await fetchDashboardData();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message ?? "Não foi possível criar o torneio.");
    } finally {
      setIsBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020b22] text-white flex items-center justify-center">
        <p className="text-slate-400">Carregando dashboard da organização...</p>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-[#020b22] text-white flex items-center justify-center flex-col gap-4">
        <p className="text-slate-400">Não foi possível carregar esta organização.</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold"
        >
          Voltar ao dashboard
        </button>
      </div>
    );
  }

  const uniquePositions = Array.from(
    new Set((organization.players ?? []).map((player) => player.primary_position || "Linha"))
  );

  return (
    <div className="min-h-screen bg-[#020b22] text-white">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div>
            <p className="text-[11px] text-[#5d6e90] font-black uppercase tracking-[0.20em]">Futclebs • Dashboard</p>
            <h1 className="text-4xl font-black mt-2">{user?.name ?? "Jogador"}</h1>
            <p className="text-sm text-[#8498be] mt-1">{organization.name}</p>
            {isAdmin && (
              <span className="inline-flex mt-2 px-3 py-1 rounded-full bg-white text-[#020b22] text-[11px] font-black uppercase">
                Modo admin
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsCreateTournamentOpen(true)}
              disabled={!isAdmin}
              className="px-5 py-3 rounded-2xl bg-[#12305f] border border-[#27467a] text-white font-black uppercase text-xs disabled:opacity-40"
            >
              Criar torneio
            </button>
            <button
              onClick={() => setIsCreateMatchOpen(true)}
              disabled={!isAdmin}
              className="px-5 py-3 rounded-2xl bg-emerald-500 text-[#021125] font-black uppercase text-xs disabled:opacity-40"
            >
              Criar só partida
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-3 rounded-2xl bg-[#0b1a39] border border-[#1f3159] text-[#7a8cb2] font-black uppercase text-xs"
            >
              Sair
            </button>
          </div>
        </header>

        {(feedback || error) && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              error
                ? "bg-red-500/10 border-red-400/20 text-red-300"
                : "bg-emerald-500/10 border-emerald-400/20 text-emerald-300"
            }`}
          >
            {error || feedback}
          </div>
        )}

        <section className="rounded-[2rem] bg-gradient-to-r from-[#0f8d63] to-[#0f6e8d] px-7 py-8 flex items-center justify-between min-h-56">
          <div>
            <p className="text-xs font-black uppercase text-emerald-100 tracking-[0.25em]">Seu nível</p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-7xl font-black leading-none">{userOverall}</span>
              <span className="text-3xl font-black text-emerald-200 mb-1">OVR</span>
            </div>
            <div className="mt-4 inline-flex px-4 py-2 rounded-xl bg-emerald-900/30 border border-emerald-200/20 text-sm font-bold">
              {userOnOrg?.primary_position || "Linha"}
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end text-right">
            <p className="text-emerald-100/80 text-xs uppercase font-black tracking-[0.2em]">Resumo</p>
            <p className="mt-2 text-2xl font-black">{openMatches.length} partidas abertas</p>
            <p className="text-emerald-100/80">{finishedMatches.length} no histórico</p>
          </div>
        </section>

        <div className="bg-[#031131] border border-[#1a2848] rounded-2xl p-1.5 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {tabs.map((tab) => {
            const count =
              tab.key === "open"
                ? openMatches.length
                : tab.key === "finished"
                ? finishedMatches.length
                : tab.key === "ranking"
                ? rankingPlayers.length
                : pendingMatches.length;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-xl py-3 text-sm font-black uppercase tracking-wider transition ${
                  activeTab === tab.key ? "bg-emerald-500 text-[#021125]" : "text-[#6a7ea8] hover:text-white"
                }`}
              >
                {tab.label}
                {count > 0 && <span className="ml-2 text-xs opacity-80">{count}</span>}
              </button>
            );
          })}
        </div>

        <section className="rounded-[2rem] min-h-56 border border-dashed border-[#1b2b4d] bg-[#02102d] p-7">
          {(activeTab === "open" || activeTab === "finished" || activeTab === "pending") &&
            (content as MatchData[]).length === 0 && (
              <p className="text-xl text-[#5f75a0] text-center py-12">Nenhuma partida encontrada nesta categoria.</p>
            )}

          {(activeTab === "open" || activeTab === "finished") && (content as MatchData[]).length > 0 && (
            <div className="w-full space-y-3">
              {(content as MatchData[]).map((match) => {
                const tournamentName = tournaments.find((tournament) => tournament.id === match.tournament_id)?.name;

                return (
                  <article
                    key={match.id}
                    className="rounded-2xl border border-[#203254] bg-[#04173b] px-4 py-4 flex flex-col gap-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="font-bold text-lg">{match.name || "Pelada Futclebs"}</p>
                        <p className="text-sm text-[#6f84ad]">{new Date(match.match_date).toLocaleString("pt-BR")}</p>
                        {tournamentName && (
                          <p className="text-xs text-emerald-300 uppercase tracking-wider mt-1">Torneio: {tournamentName}</p>
                        )}
                      </div>

                      <div className="flex gap-2 items-center">
                        <span className="inline-flex px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-300/20 text-emerald-300 text-xs font-bold uppercase w-fit">
                          {match.status === "finished"
                            ? "Finalizada"
                            : match.status === "in_progress"
                            ? "Em andamento"
                            : "Aberta"}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => setAdminMatchId((current) => (current === match.id ? null : match.id))}
                            className="px-3 py-1 rounded-lg bg-[#0d234b] border border-[#1d3560] text-xs font-bold uppercase"
                          >
                            Administrar
                          </button>
                        )}
                      </div>
                    </div>

                    {isAdmin && adminMatchId === match.id && (
                      <div className="grid sm:grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setFeedback(`Painel da partida #${match.id} carregado.`);
                            setError(null);
                          }}
                          className="rounded-xl bg-[#102a57] border border-[#224374] py-2 text-xs font-black uppercase"
                        >
                          Abrir painel técnico
                        </button>
                        <button
                          onClick={() => {
                            setIsCreateMatchOpen(true);
                            setNewMatchName(`Revanche ${match.name || "Futclebs"}`);
                          }}
                          className="rounded-xl bg-[#0f8d63] py-2 text-xs font-black uppercase text-[#021125]"
                        >
                          Criar nova rodada
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {activeTab === "ranking" && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-3">
                {topThreePlayers.map((player, index) => (
                  <article
                    key={player.id}
                    className="rounded-2xl border border-[#1f3358] bg-gradient-to-b from-[#0d2249] to-[#081731] p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-[#89a4d3]">#{index + 1} Lugar</p>
                    <p className="mt-2 text-lg font-bold">{player.name}</p>
                    <p className="text-xs text-[#6a7ea8] uppercase">{player.primary_position || "Linha"}</p>
                    <p className="text-4xl font-black text-emerald-400 mt-4">{player.pivot?.overall ?? 0}</p>
                    <p className="text-xs text-[#9fb5db] mt-2">⚽ {player.goals_total ?? 0} • 🅰️ {player.assists_total ?? 0}</p>
                  </article>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={rankingSearch}
                  onChange={(event) => setRankingSearch(event.target.value)}
                  placeholder="Buscar jogador"
                  className="flex-1 rounded-xl bg-[#031131] border border-[#1b2f57] px-3 py-2 text-sm"
                />
                <select
                  value={rankingPositionFilter}
                  onChange={(event) => setRankingPositionFilter(event.target.value)}
                  className="rounded-xl bg-[#031131] border border-[#1b2f57] px-3 py-2 text-sm"
                >
                  <option value="all">Todas as posições</option>
                  {uniquePositions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full grid sm:grid-cols-2 gap-3">
                {restOfRanking.map((player, index) => (
                  <article
                    key={player.id}
                    className="rounded-2xl border border-[#1f3358] bg-[#04173b] px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold">#{index + 4} {player.name}</p>
                      <p className="text-xs text-[#6a7ea8] uppercase">{player.primary_position || "Linha"}</p>
                      <p className="text-xs text-[#9fb5db]">⚽ {player.goals_total ?? 0} • 🅰️ {player.assists_total ?? 0}</p>
                    </div>
                    <span className="text-2xl font-black text-emerald-400">{player.pivot?.overall ?? 0}</span>
                  </article>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <article className="rounded-2xl border border-[#1f3358] bg-[#04173b] p-4">
                  <h4 className="font-black text-sm uppercase text-emerald-300">Ranking de Artilheiros</h4>
                  <div className="mt-3 space-y-2">
                    {topScorers.map((player, index) => (
                      <div key={`scorer-${player.id}`} className="flex items-center justify-between text-sm">
                        <span>#{index + 1} {player.name}</span>
                        <span className="font-black text-emerald-400">⚽ {player.goals_total ?? 0}</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-2xl border border-[#1f3358] bg-[#04173b] p-4">
                  <h4 className="font-black text-sm uppercase text-blue-300">Ranking de Assistentes</h4>
                  <div className="mt-3 space-y-2">
                    {topAssisters.map((player, index) => (
                      <div key={`assist-${player.id}`} className="flex items-center justify-between text-sm">
                        <span>#{index + 1} {player.name}</span>
                        <span className="font-black text-blue-300">🅰️ {player.assists_total ?? 0}</span>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </div>

          )}
        </section>
      </div>

      {(isCreateMatchOpen || isCreateTournamentOpen) && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#071632] border border-[#203760] p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black uppercase tracking-wider">
                {isCreateMatchOpen ? "Criar Partida" : "Criar Torneio"}
              </h3>
              <button
                onClick={() => {
                  setIsCreateMatchOpen(false);
                  setIsCreateTournamentOpen(false);
                }}
                className="text-slate-300"
              >
                ✕
              </button>
            </div>

            {isCreateMatchOpen && (
              <form onSubmit={submitCreateMatch} className="space-y-4">
                <input
                  value={newMatchName}
                  onChange={(event) => setNewMatchName(event.target.value)}
                  className="w-full rounded-xl bg-[#031131] border border-[#1b2f57] px-3 py-2 text-sm"
                  placeholder="Nome da partida"
                />
                <input
                  type="datetime-local"
                  value={newMatchDate}
                  onChange={(event) => setNewMatchDate(event.target.value)}
                  className="w-full rounded-xl bg-[#031131] border border-[#1b2f57] px-3 py-2 text-sm"
                  required
                />
                <select
                  value={newMatchTournamentId}
                  onChange={(event) => setNewMatchTournamentId(event.target.value)}
                  className="w-full rounded-xl bg-[#031131] border border-[#1b2f57] px-3 py-2 text-sm"
                >
                  <option value="none">Sem torneio (partida avulsa)</option>
                  {tournaments.map((tournament) => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full rounded-xl bg-emerald-500 text-[#021125] font-black py-3"
                >
                  {isBusy ? "Criando..." : "Criar partida"}
                </button>
              </form>
            )}

            {isCreateTournamentOpen && (
              <form onSubmit={submitCreateTournament} className="space-y-4">
                <input
                  value={newTournamentName}
                  onChange={(event) => setNewTournamentName(event.target.value)}
                  className="w-full rounded-xl bg-[#031131] border border-[#1b2f57] px-3 py-2 text-sm"
                  placeholder="Nome do torneio"
                  required
                />
                <select
                  value={newTournamentType}
                  onChange={(event) => setNewTournamentType(event.target.value as TournamentType)}
                  className="w-full rounded-xl bg-[#031131] border border-[#1b2f57] px-3 py-2 text-sm"
                >
                  <option value="league">Liga</option>
                  <option value="knockout">Mata-mata</option>
                </select>
                <input
                  type="date"
                  value={newTournamentStartDate}
                  onChange={(event) => setNewTournamentStartDate(event.target.value)}
                  className="w-full rounded-xl bg-[#031131] border border-[#1b2f57] px-3 py-2 text-sm"
                />

                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full rounded-xl bg-[#4d9cff] text-[#021125] font-black py-3"
                >
                  {isBusy ? "Criando..." : "Criar torneio"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
