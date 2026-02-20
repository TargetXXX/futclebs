import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/services/axios";

type MatchStatus = "open" | "in_progress" | "finished";
type DashboardTab = "open" | "pending" | "finished" | "ranking";

interface MatchData {
  id: number;
  name?: string;
  match_date: string;
  status: MatchStatus;
}

interface TournamentData {
  id: number;
  name: string;
  matches?: MatchData[];
}

interface OrganizationPlayer {
  id: number;
  name: string;
  avatar?: string | null;
  primary_position?: string | null;
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

  useEffect(() => {
    if (!orgId) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [orgResponse, meResponse, tournamentsResponse] = await Promise.all([
          api.get(`/organizations/${orgId}`),
          api.get("/auth/me"),
          api.get(`/organizations/${orgId}/tournaments`),
        ]);

        const orgPayload = orgResponse.data?.data ?? orgResponse.data;
        const mePayload = meResponse.data?.data ?? meResponse.data;
        const tournamentsPayload = tournamentsResponse.data?.data ?? tournamentsResponse.data ?? [];

        setOrganization(orgPayload);
        setUser(mePayload);

        const flattenedMatches: MatchData[] = (tournamentsPayload as TournamentData[]).flatMap(
          (tournament) => tournament.matches ?? []
        );

        setMatches(flattenedMatches);
      } catch (error) {
        console.error("Erro ao carregar dashboard da organização", error);
        setOrganization(null);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

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
      .sort((a, b) => (b.pivot?.overall ?? 0) - (a.pivot?.overall ?? 0))
      .slice(0, 8);
  }, [organization?.players]);

  const content =
    activeTab === "open"
      ? openMatches
      : activeTab === "finished"
      ? finishedMatches
      : activeTab === "pending"
      ? []
      : rankingPlayers;

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

  return (
    <div className="min-h-screen bg-[#020b22] text-white">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div>
            <p className="text-[11px] text-[#5d6e90] font-black uppercase tracking-[0.20em]">Futclebs • Dashboard</p>
            <h1 className="text-4xl font-black mt-2">{user?.name ?? "Jogador"}</h1>
            {isAdmin && (
              <span className="inline-flex mt-2 px-3 py-1 rounded-full bg-white text-[#020b22] text-[11px] font-black uppercase">
                Modo admin
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <button className="px-5 py-3 rounded-2xl bg-emerald-500 text-[#021125] font-black uppercase text-sm">
              Criar partida
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-3 rounded-2xl bg-[#0b1a39] border border-[#1f3159] text-[#7a8cb2] font-black uppercase text-sm"
            >
              Sair
            </button>
          </div>
        </header>

        <section className="rounded-[2rem] bg-[#0f8d63] px-7 py-8 flex items-center justify-between min-h-56">
          <div>
            <p className="text-xs font-black uppercase text-emerald-100 tracking-[0.25em]">Seu nível</p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-7xl font-black leading-none">{userOverall}</span>
              <span className="text-3xl font-black text-emerald-300 mb-1">OVR</span>
            </div>
            <div className="mt-4 inline-flex px-4 py-2 rounded-xl bg-emerald-900/30 border border-emerald-200/20 text-sm font-bold">
              {userOnOrg?.primary_position || "Linha"}
            </div>
          </div>

          <div className="hidden sm:flex w-16 h-16 rounded-2xl border border-emerald-200/25 items-center justify-center text-3xl bg-emerald-900/25">
            📊
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
                : 0;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-xl py-3 text-sm font-black uppercase tracking-wider transition ${
                  activeTab === tab.key
                    ? "bg-emerald-500 text-[#021125]"
                    : "text-[#6a7ea8] hover:text-white"
                }`}
              >
                {tab.label}
                {count > 0 && <span className="ml-2 text-xs opacity-80">{count}</span>}
              </button>
            );
          })}
        </div>

        <section className="rounded-[2rem] min-h-56 border border-dashed border-[#1b2b4d] bg-[#02102d] p-7 flex items-center justify-center">
          {(activeTab === "open" || activeTab === "finished" || activeTab === "pending") && (content as MatchData[]).length === 0 && (
            <p className="text-xl text-[#5f75a0]">Nenhuma partida encontrada nesta categoria.</p>
          )}

          {(activeTab === "open" || activeTab === "finished") && (content as MatchData[]).length > 0 && (
            <div className="w-full space-y-3">
              {(content as MatchData[]).map((match) => (
                <article
                  key={match.id}
                  className="rounded-2xl border border-[#203254] bg-[#04173b] px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold">{match.name || "Pelada Futclebs"}</p>
                    <p className="text-sm text-[#6f84ad]">{new Date(match.match_date).toLocaleString("pt-BR")}</p>
                  </div>
                  <span className="mt-2 sm:mt-0 inline-flex px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-300/20 text-emerald-300 text-xs font-bold uppercase w-fit">
                    {match.status === "finished" ? "Finalizada" : "Aberta"}
                  </span>
                </article>
              ))}
            </div>
          )}

          {activeTab === "ranking" && rankingPlayers.length > 0 && (
            <div className="w-full grid sm:grid-cols-2 gap-3">
              {rankingPlayers.map((player, index) => (
                <article
                  key={player.id}
                  className="rounded-2xl border border-[#1f3358] bg-[#04173b] px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold">#{index + 1} {player.name}</p>
                    <p className="text-xs text-[#6a7ea8] uppercase">{player.primary_position || "Linha"}</p>
                  </div>
                  <span className="text-2xl font-black text-emerald-400">{player.pivot?.overall ?? 0}</span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
