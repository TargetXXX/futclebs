import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/services/axios";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Empty,
  Input,
  List,
  message,
  Modal,
  Progress,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  CommentOutlined,
  FireOutlined,
  PlusOutlined,
  ReloadOutlined,
  SendOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { UniversalNavbar } from "@/components/layout/UniversalNavbar";
import { TeamPreset, loadTeamPresets, saveTeamPresets } from "@/utils/teamPresets";

type MatchStatus = "open" | "in_progress" | "finished";
type DashboardTab = "open" | "pending" | "finished" | "ranking" | "tournaments";
type TournamentType = "league" | "knockout";

interface TeamData {
  id: number;
  tournament_id: number;
  name: string;
  logo?: string | null;
  coach_id?: number | null;
  coach?: { id: number; name: string } | null;
  players?: { id: number; name: string }[];
}

interface MatchData {
  id: number;
  name?: string;
  match_date: string;
  status: MatchStatus;
  tournament_id?: number | null;
  team_a_id?: number | null;
  team_b_id?: number | null;
  players_count?: number;
  has_pending_votes?: boolean;
}

interface MatchComment {
  id: number;
  content: string;
  player_id: number;
  created_at: string;
  player?: { id: number; name: string; avatar?: string | null };
}

interface TournamentData {
  id: number;
  name: string;
  type?: TournamentType;
  start_date?: string | null;
  end_date?: string | null;
  teams?: TeamData[];
  matches?: MatchData[];
}

interface OrganizationPlayer {
  id: number;
  name: string;
  email?: string;
  username?: string;
  avatar?: string | null;
  primary_position?: string | null;
  secondary_position?: string | null;
  birthdate?: string | null;
  gender?: string | null;
  status?: string | null;
  goals_total?: number;
  assists_total?: number;
  pivot?: {
    is_admin?: boolean;
    overall?: number;
    velocidade?: number;
    finalizacao?: number;
    passe?: number;
    drible?: number;
    defesa?: number;
    fisico?: number;
    esportividade?: number;
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

const { Title, Text } = Typography;

const normalizeIds = (ids: number[]) => Array.from(new Set(ids.filter((id) => Number.isInteger(id) && id > 0)));

export default function OrganizationDashboard() {
  const navigate = useNavigate();
  const { orgId } = useParams();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>("open");
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [tournaments, setTournaments] = useState<TournamentData[]>([]);

  const [isCreateMatchOpen, setIsCreateMatchOpen] = useState(false);
  const [isCreateTournamentOpen, setIsCreateTournamentOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const [newMatchDate, setNewMatchDate] = useState("");
  const [newMatchName, setNewMatchName] = useState("Partida amistosa");
  const [newMatchTournamentId, setNewMatchTournamentId] = useState<string>("none");
  const [newMatchTeamAId, setNewMatchTeamAId] = useState<string>("");
  const [newMatchTeamBId, setNewMatchTeamBId] = useState<string>("");

  const [newTournamentName, setNewTournamentName] = useState("");
  const [newTournamentType, setNewTournamentType] = useState<TournamentType>("league");
  const [newTournamentStartDate, setNewTournamentStartDate] = useState("");
  const [newTournamentTeams, setNewTournamentTeams] = useState<string[]>([]);

  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetPlayerIds, setPresetPlayerIds] = useState<number[]>([]);
  const [presetCoachId, setPresetCoachId] = useState<number | null>(null);
  const [teamPresets, setTeamPresets] = useState<TeamPreset[]>([]);

  const [rankingSearch, setRankingSearch] = useState("");
  const [rankingPositionFilter, setRankingPositionFilter] = useState("all");
  const [selectedPlayer, setSelectedPlayer] = useState<OrganizationPlayer | null>(null);

  const [commentsModalMatch, setCommentsModalMatch] = useState<MatchData | null>(null);
  const [comments, setComments] = useState<MatchComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [matchTournamentFilter, setMatchTournamentFilter] = useState<string>("all");

  const [lineupMatch, setLineupMatch] = useState<MatchData | null>(null);
  const [lineupPlayers, setLineupPlayers] = useState<OrganizationPlayer[]>([]);
  const [teamAIds, setTeamAIds] = useState<number[]>([]);
  const [teamBIds, setTeamBIds] = useState<number[]>([]);
  const [lineupLoading, setLineupLoading] = useState(false);

  const formatDateForApi = (dateValue: string) => (dateValue ? `${dateValue} 20:00:00` : "");

  const formatDateTimeLabel = (dateValue: string) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Data inválida";
    return date.toLocaleString("pt-BR");
  };

  const fetchDashboardData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [orgResponse, meResponse, tournamentsResponse, matchesResponse] = await Promise.all([
        api.get(`/organizations/${orgId}`),
        api.get("/auth/me"),
        api.get(`/organizations/${orgId}/tournaments`, { params: { organization_id: orgId } }),
        api.get(`/organizations/${orgId}/matches`, { params: { organization_id: orgId } }),
      ]);

      const orgPayload = orgResponse.data?.data ?? orgResponse.data;
      const mePayload = meResponse.data?.data ?? meResponse.data;
      const tournamentsPayload = tournamentsResponse.data?.data ?? tournamentsResponse.data ?? [];
      const matchesPayload = matchesResponse.data?.data ?? matchesResponse.data ?? [];

      const finishedMatches = (matchesPayload as MatchData[]).filter((match) => match.status === "finished");
      const voteStatusEntries = await Promise.all(
        finishedMatches.map(async (match) => {
          try {
            const { data } = await api.get(`/matches/${match.id}/votes/status`);
            return [match.id, !Boolean(data?.is_fully_voted)] as const;
          } catch {
            return [match.id, false] as const;
          }
        }),
      );

      const pendingByMatchId = new Map<number, boolean>(voteStatusEntries);
      const normalizedMatches = (matchesPayload as MatchData[]).map((match) => ({
        ...match,
        has_pending_votes: pendingByMatchId.get(match.id) ?? false,
      }));

      setOrganization(orgPayload);
      setUser(mePayload);
      setTournaments(tournamentsPayload as TournamentData[]);
      setMatches(normalizedMatches);
    } catch (error) {
      console.error("Erro ao carregar dashboard da organização", error);
      setOrganization(null);
      setMatches([]);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) localStorage.setItem("orgId", orgId);
    fetchDashboardData();
  }, [orgId]);


  useEffect(() => {
    setTeamPresets(loadTeamPresets(orgId));
  }, [orgId]);

  useEffect(() => {
    setNewMatchTeamAId("");
    setNewMatchTeamBId("");

    if (newMatchTournamentId === "none") {
      setNewMatchName("Partida amistosa");
      return;
    }

    setNewMatchName("Partida de torneio");
  }, [newMatchTournamentId]);

  const userOnOrg = useMemo(
    () => organization?.players?.find((player) => player.id === user?.id),
    [organization?.players, user?.id],
  );

  const userOverall = userOnOrg?.pivot?.overall ?? 0;
  const isAdmin = Boolean(userOnOrg?.pivot?.is_admin);
  const actionButtonClass =
    "!h-10 !rounded-xl !border-slate-500/40 !bg-slate-900/70 !px-4 !font-semibold !text-slate-100 hover:!border-cyan-300/60 hover:!text-cyan-200 hover:!shadow-[0_0_20px_rgba(34,211,238,0.18)]";
  const primaryButtonClass =
    "!h-10 !rounded-xl !border-0 !bg-gradient-to-r !from-emerald-400 !to-cyan-400 !px-4 !font-semibold !shadow-md !shadow-emerald-500/25 hover:!from-emerald-300 hover:!to-cyan-300 hover:!shadow-[0_0_24px_rgba(45,212,191,0.35)]";

  const openMatches = useMemo(() => matches.filter((match) => match.status !== "finished"), [matches]);
  const finishedMatches = useMemo(() => matches.filter((match) => match.status === "finished"), [matches]);
  const pendingMatches = useMemo(
    () => matches.filter((match) => match.status === "finished" && match.has_pending_votes),
    [matches],
  );

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

  const rankingFieldPlayers = useMemo(
    () => rankingPlayers.filter((player) => (player.primary_position || "Linha").toLowerCase() !== "goleiro").slice(0, 3),
    [rankingPlayers],
  );

  const rankingGoalkeepers = useMemo(
    () => rankingPlayers.filter((player) => (player.primary_position || "Linha").toLowerCase() === "goleiro").slice(0, 3),
    [rankingPlayers],
  );

  const tournamentById = useMemo(
    () => new Map(tournaments.map((tournament) => [tournament.id, tournament])),
    [tournaments],
  );

  const selectedMatchTournament = useMemo(() => {
    if (newMatchTournamentId === "none") return null;
    return tournamentById.get(Number(newMatchTournamentId)) ?? null;
  }, [newMatchTournamentId, tournamentById]);

  const selectedTournamentTeams = selectedMatchTournament?.teams ?? [];

  const selectedTournamentTeamOptions = useMemo(
    () => selectedTournamentTeams.map((team) => {
      const playersCount = team.players?.length ?? 0;
      const coachLabel = team.coach?.name ? ` • Técnico: ${team.coach.name}` : "";
      return {
        value: String(team.id),
        label: `${team.name} (${playersCount} jogadores${coachLabel})`,
        disabled: playersCount === 0,
      };
    }),
    [selectedTournamentTeams],
  );

  const selectedTeamAData = useMemo(
    () => selectedTournamentTeams.find((team) => String(team.id) === newMatchTeamAId) ?? null,
    [selectedTournamentTeams, newMatchTeamAId],
  );

  const selectedTeamBData = useMemo(
    () => selectedTournamentTeams.find((team) => String(team.id) === newMatchTeamBId) ?? null,
    [selectedTournamentTeams, newMatchTeamBId],
  );

  const lineupPlayersById = useMemo(
    () => new Map(lineupPlayers.map((player) => [player.id, player])),
    [lineupPlayers],
  );

  const lineupSummary = useMemo(() => {
    const normalizedA = normalizeIds(teamAIds);
    const normalizedB = normalizeIds(teamBIds.filter((id) => !normalizedA.includes(id)));

    const overallA = normalizedA.reduce(
      (sum, playerId) => sum + (lineupPlayersById.get(playerId)?.pivot?.overall ?? 0),
      0,
    );
    const overallB = normalizedB.reduce(
      (sum, playerId) => sum + (lineupPlayersById.get(playerId)?.pivot?.overall ?? 0),
      0,
    );

    return {
      countA: normalizedA.length,
      countB: normalizedB.length,
      overallA,
      overallB,
      difference: Math.abs(overallA - overallB),
      unassigned: lineupPlayers.length - normalizedA.length - normalizedB.length,
      isBalanced: Math.abs(overallA - overallB) <= 8,
    };
  }, [lineupPlayers, lineupPlayersById, teamAIds, teamBIds]);

  const openCommentsModal = async (match: MatchData) => {
    setCommentsModalMatch(match);
    setCommentsLoading(true);
    try {
      const { data } = await api.get(`/matches/${match.id}/comments`);
      setComments(data || []);
    } catch {
      messageApi.error("Não foi possível carregar os comentários.");
    } finally {
      setCommentsLoading(false);
    }
  };

  const addComment = async () => {
    if (!commentsModalMatch || !newComment.trim()) return;
    try {
      await api.post(`/matches/${commentsModalMatch.id}/comments`, { content: newComment.trim() });
      setNewComment("");
      await openCommentsModal(commentsModalMatch);
    } catch {
      messageApi.error("Falha ao enviar comentário.");
    }
  };

  const deleteComment = async (commentId: number) => {
    try {
      await api.delete(`/comments/${commentId}`);
      if (commentsModalMatch) await openCommentsModal(commentsModalMatch);
    } catch {
      messageApi.error("Você só pode remover os seus comentários.");
    }
  };

  const openLineupDrawer = async (match: MatchData) => {
    setLineupMatch(match);
    setLineupLoading(true);
    try {
      const [{ data: playersData }, { data: matchData }] = await Promise.all([
        api.get(`/matches/${match.id}/players`),
        api.get(`/matches/${match.id}`),
      ]);

      setLineupPlayers((playersData?.data ?? playersData ?? []) as OrganizationPlayer[]);

      const payload = matchData?.data ?? matchData;
      const normalizedA = normalizeIds(payload?.result?.players_team_a ?? []);
      const normalizedB = normalizeIds(
        (payload?.result?.players_team_b ?? []).filter((id: number) => !normalizedA.includes(id)),
      );
      setTeamAIds(normalizedA);
      setTeamBIds(normalizedB);
    } catch {
      messageApi.error("Não foi possível abrir escalação.");
      setLineupPlayers([]);
      setTeamAIds([]);
      setTeamBIds([]);
    } finally {
      setLineupLoading(false);
    }
  };

  const registerInMatch = async () => {
    if (!lineupMatch || !user) return;
    try {
      await api.post(`/matches/${lineupMatch.id}/players/${user.id}`);
      await openLineupDrawer(lineupMatch);
      await fetchDashboardData();
      messageApi.success("Você entrou na partida.");
    } catch {
      messageApi.error("Não foi possível entrar na partida.");
    }
  };

  const leaveMatch = async () => {
    if (!lineupMatch || !user) return;
    try {
      await api.delete(`/matches/${lineupMatch.id}/players/${user.id}`);
      await openLineupDrawer(lineupMatch);
      await fetchDashboardData();
      messageApi.success("Você saiu da partida.");
    } catch {
      messageApi.error("Não foi possível sair da partida.");
    }
  };

  const randomizeTeams = () => {
    const sortedByOverall = [...lineupPlayers].sort(
      (a, b) => (b.pivot?.overall ?? 0) - (a.pivot?.overall ?? 0),
    );

    const nextTeamA: number[] = [];
    const nextTeamB: number[] = [];
    let sumA = 0;
    let sumB = 0;

    sortedByOverall.forEach((player, index) => {
      const overall = player.pivot?.overall ?? 0;
      const shouldGoA = index % 2 === 0 ? sumA <= sumB : sumA < sumB;

      if (shouldGoA) {
        nextTeamA.push(player.id);
        sumA += overall;
      } else {
        nextTeamB.push(player.id);
        sumB += overall;
      }
    });

    setTeamAIds(nextTeamA);
    setTeamBIds(nextTeamB);
  };

  const clearTeams = () => {
    setTeamAIds([]);
    setTeamBIds([]);
  };

  const movePlayerTo = (playerId: number, target: "A" | "B") => {
    if (target === "A") {
      setTeamBIds((prev) => prev.filter((id) => id !== playerId));
      setTeamAIds((prev) => (prev.includes(playerId) ? prev : [...prev, playerId]));
    } else {
      setTeamAIds((prev) => prev.filter((id) => id !== playerId));
      setTeamBIds((prev) => (prev.includes(playerId) ? prev : [...prev, playerId]));
    }
  };

  const saveLineup = async () => {
    if (!lineupMatch || !isAdmin) return;

    const normalizedA = normalizeIds(teamAIds);
    const normalizedB = normalizeIds(teamBIds.filter((id) => !normalizedA.includes(id)));

    if (normalizedA.length === 0 || normalizedB.length === 0) {
      messageApi.warning("Os dois times precisam ter pelo menos 1 jogador.");
      return;
    }

    if (lineupPlayers.length > normalizedA.length + normalizedB.length) {
      messageApi.warning("Distribua todos os jogadores entre os times antes de salvar.");
      return;
    }

    try {
      await api.put(`/matches/${lineupMatch.id}/result`, {
        players_team_a: normalizedA,
        players_team_b: normalizedB,
      });
      messageApi.success("Escalações salvas com sucesso.");
    } catch {
      try {
        await api.post(`/matches/${lineupMatch.id}/result`, {
          players_team_a: normalizedA,
          players_team_b: normalizedB,
        });
        messageApi.success("Escalações salvas com sucesso.");
      } catch {
        messageApi.error("Não foi possível salvar a escalação.");
      }
    }
  };

  const openCreateMatchForTournament = (tournamentId: number) => {
    setNewMatchTournamentId(String(tournamentId));
    setNewMatchName("Rodada do torneio");
    setIsCreateMatchOpen(true);
  };

  const viewTournamentMatches = (tournamentId: number) => {
    setMatchTournamentFilter(String(tournamentId));
    setActiveTab("open");
  };

  const upsertTeamPreset = () => {
    if (!orgId || !presetName.trim()) {
      messageApi.warning("Informe o nome do time pré-cadastrado.");
      return;
    }

    const normalizedName = presetName.trim();
    const duplicate = teamPresets.find((preset) => preset.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase());

    const nextPreset: TeamPreset = {
      id: duplicate?.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: normalizedName,
      playerIds: Array.from(new Set(presetPlayerIds.map((id) => Number(id)).filter((id) => id > 0))),
      coachId: presetCoachId,
      updatedAt: new Date().toISOString(),
    };

    const nextPresets = duplicate
      ? teamPresets.map((preset) => (preset.id === duplicate.id ? nextPreset : preset))
      : [nextPreset, ...teamPresets];

    setTeamPresets(nextPresets);
    saveTeamPresets(orgId, nextPresets);
    setPresetName("");
    setPresetPlayerIds([]);
    setPresetCoachId(null);
    messageApi.success(duplicate ? "Time pré-cadastrado atualizado." : "Time pré-cadastrado criado.");
  };

  const removeTeamPreset = (presetId: string) => {
    if (!orgId) return;
    const nextPresets = teamPresets.filter((preset) => preset.id !== presetId);
    setTeamPresets(nextPresets);
    saveTeamPresets(orgId, nextPresets);
    messageApi.success("Time pré-cadastrado removido.");
  };

  const importPresetNamesToTournament = () => {
    const merged = Array.from(new Set([...newTournamentTeams, ...teamPresets.map((preset) => preset.name)]));
    setNewTournamentTeams(merged);
    messageApi.success("Times pré-cadastrados adicionados ao torneio.");
  };

  const submitCreateMatch = async (event: FormEvent) => {
    event.preventDefault();
    if (!orgId || !newMatchDate) return;

    const isTournamentMatch = newMatchTournamentId !== "none";
    if (isTournamentMatch && (!newMatchTeamAId || !newMatchTeamBId)) {
      messageApi.warning("Selecione os dois times para a partida do torneio.");
      return;
    }

    if (isTournamentMatch && newMatchTeamAId === newMatchTeamBId) {
      messageApi.warning("Os times da partida precisam ser diferentes.");
      return;
    }

    if (isTournamentMatch) {
      if ((selectedTeamAData?.players?.length ?? 0) === 0 || (selectedTeamBData?.players?.length ?? 0) === 0) {
        messageApi.warning("Os dois times precisam ter elenco antes de criar a partida.");
        return;
      }
    }

    setIsBusy(true);
    try {
      await api.post("/matches", {
        organization_id: Number(orgId),
        name: newMatchName.trim() || "Rachão BOLANOPE",
        match_date: formatDateForApi(newMatchDate),
        tournament_id: isTournamentMatch ? Number(newMatchTournamentId) : null,
        team_a_id: isTournamentMatch ? Number(newMatchTeamAId) : null,
        team_b_id: isTournamentMatch ? Number(newMatchTeamBId) : null,
      });
      setNewMatchDate("");
      setNewMatchName("Partida amistosa");
      setNewMatchTournamentId("none");
      setIsCreateMatchOpen(false);
      messageApi.success("Partida criada com sucesso.");
      await fetchDashboardData();
    } catch {
      messageApi.error("Não foi possível criar a partida.");
    } finally {
      setIsBusy(false);
    }
  };

  const submitCreateTournament = async (event: FormEvent) => {
    event.preventDefault();

    const validTeams = Array.from(
      new Map(
        newTournamentTeams
          .map((name) => name.trim())
          .filter((name) => name.length >= 2)
          .map((name) => [name.toLocaleLowerCase(), name]),
      ).values(),
    );

    if (!orgId || !newTournamentName.trim()) return;
    if (validTeams.length < 2) {
      messageApi.warning("Cadastre ao menos 2 times antes de criar o torneio.");
      return;
    }

    setIsBusy(true);
    try {
      await api.post("/tournaments", {
        organization_id: Number(orgId),
        name: newTournamentName.trim(),
        type: newTournamentType,
        start_date: newTournamentStartDate || null,
        teams: validTeams,
      });

      setNewTournamentName("");
      setNewTournamentStartDate("");
      setNewTournamentTeams([]);
      setIsCreateTournamentOpen(false);
      messageApi.success("Torneio e times criados com sucesso.");
      await fetchDashboardData();
    } catch {
      messageApi.error("Não foi possível criar o torneio com times.");
    } finally {
      setIsBusy(false);
    }
  };

  const tabItems = [
    { label: `Abertas (${openMatches.length})`, value: "open" },
    { label: `Votar (${pendingMatches.length})`, value: "pending" },
    { label: `Histórico (${finishedMatches.length})`, value: "finished" },
    { label: `Ranking (${rankingPlayers.length})`, value: "ranking" },
    { label: `Central de Torneios (${tournaments.length})`, value: "tournaments" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!organization) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Sem dados.</div>;
  }

  const uniquePositions = Array.from(
    new Set((organization.players ?? []).map((player) => player.primary_position || "Linha")),
  );
  const tabMatches = activeTab === "open" ? openMatches : activeTab === "finished" ? finishedMatches : pendingMatches;
  const activeMatches =
    matchTournamentFilter === "all"
      ? tabMatches
      : tabMatches.filter((match) => String(match.tournament_id ?? "") === matchTournamentFilter);
  const isUserRegisteredInLineup = lineupPlayers.some((player) => player.id === user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-[#050d23] text-white">
      <UniversalNavbar />
      {contextHolder}
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Text className="!text-[#7c93bf] !uppercase !tracking-[0.2em]">BOLANOPE • Organização</Text>
            <Title level={2} className="!text-white !m-0">{user?.name}</Title>
            <Text className="!text-[#9bb1d9]">{organization.name}</Text>
          </div>

          <Space wrap>
            {isAdmin && (
              <Button className={primaryButtonClass} icon={<PlusOutlined />} onClick={() => setIsCreateTournamentOpen(true)}>
                Novo torneio
              </Button>
            )}
            {isAdmin && (
              <Button className={actionButtonClass} icon={<TeamOutlined />} onClick={() => setIsPresetModalOpen(true)}>
                Times da organização
              </Button>
            )}
            {isAdmin && (
              <Button
                className={primaryButtonClass}
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setNewMatchTournamentId("none");
                  setNewMatchName("Partida amistosa");
                  setIsCreateMatchOpen(true);
                }}
              >
                Nova partida
              </Button>
            )}
            <Button className={actionButtonClass} icon={<ReloadOutlined />} onClick={fetchDashboardData}>Atualizar</Button>
            <Button className={actionButtonClass} onClick={() => navigate("/dashboard")}>Voltar</Button>
          </Space>
        </div>

        <Card className="dashboard-glow !bg-gradient-to-r !from-[#0f6f52] !via-[#0b4e78] !to-[#123a70] !border !border-cyan-300/20 !rounded-2xl !shadow-xl !shadow-cyan-950/30">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={16}>
              <Text className="!text-emerald-100 !uppercase">Seu nível</Text>
              <Title className="!text-white !m-0" level={1}>
                {userOverall} <span className="text-2xl">OVR</span>
              </Title>
              <Tag color="green">{userOnOrg?.primary_position || "Linha"}</Tag>
            </Col>
            <Col xs={24} md={8}>
              <Statistic title="Partidas abertas" value={openMatches.length} valueStyle={{ color: "#fff" }} />
              <Statistic title="Partidas finalizadas" value={finishedMatches.length} valueStyle={{ color: "#d4ffef" }} />
            </Col>
          </Row>
        </Card>

        <Segmented className="dashboard-glow [&_.ant-segmented-group]:!gap-1 [&_.ant-segmented-item]:!rounded-xl [&_.ant-segmented-item]:!font-semibold [&_.ant-segmented-item]:!tracking-wide [&_.ant-segmented-item]:!text-slate-200" block options={tabItems} value={activeTab} onChange={(value) => setActiveTab(value as DashboardTab)} />

        {(activeTab === "open" || activeTab === "finished" || activeTab === "pending") && (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Text className="!text-slate-300">Filtro de torneio:</Text>
              <Select
                value={matchTournamentFilter}
                onChange={setMatchTournamentFilter}
                style={{ minWidth: 260 }} className="[&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!border-slate-600 [&_.ant-select-selector]:!bg-slate-950/70 [&_.ant-select-selector]:!text-slate-100"
                options={[
                  { value: "all", label: "Todas as partidas" },
                  ...tournaments.map((tournament) => ({
                    value: String(tournament.id),
                    label: tournament.name,
                  })),
                ]}
              />
            </div>
            {activeMatches.length === 0 && <Empty description="Nenhuma partida encontrada" />}
            {activeMatches.map((match) => {
              const tournament = match.tournament_id ? tournamentById.get(match.tournament_id) : null;
              const teamA = tournament?.teams?.find((team) => team.id === match.team_a_id);
              const teamB = tournament?.teams?.find((team) => team.id === match.team_b_id);

              return (
                <Card
                  key={match.id}
                  hoverable
                  className="!bg-gradient-to-br !from-[#071b43] !to-[#0a224d] !border-[#2a4f7d] !rounded-2xl !shadow-lg !shadow-cyan-900/20 transition-all duration-300 hover:!-translate-y-1 hover:!border-cyan-300/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Title level={4} className="!text-white !m-0">{match.name || "Pelada BOLANOPE"}</Title>
                      <Text className="!text-[#8ea4cf]"><CalendarOutlined /> {formatDateTimeLabel(match.match_date)}</Text>
                      {tournament && <div><Tag color="cyan">Torneio: {tournament.name}</Tag></div>}
                      {teamA && teamB && <div><Tag color="purple">{teamA.name} x {teamB.name}</Tag></div>}
                    </div>
                    <Space wrap>
                      <Tag color={match.status === "finished" ? "default" : "green"}>{match.status}</Tag>
                      <Button className={actionButtonClass} icon={<TeamOutlined />} onClick={() => openLineupDrawer(match)}>Escalação</Button>
                      <Button className={actionButtonClass} icon={<CommentOutlined />} onClick={() => openCommentsModal(match)}>Comentários</Button>
                    </Space>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {activeTab === "ranking" && (
          <div className="space-y-6">
            <Space wrap>
              <Input className="!rounded-xl !border-slate-600 !bg-slate-950/70 !text-slate-100" placeholder="Buscar jogador" value={rankingSearch} onChange={(e) => setRankingSearch(e.target.value)} />
              <Select
                value={rankingPositionFilter}
                onChange={setRankingPositionFilter}
                options={[
                  { label: "Todas as posições", value: "all" },
                  ...uniquePositions.map((position) => ({ label: position, value: position })),
                ]}
                style={{ minWidth: 220 }} className="[&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!border-slate-600 [&_.ant-select-selector]:!bg-slate-950/70 [&_.ant-select-selector]:!text-slate-100"
              />
            </Space>

            {[
              { title: "Elite de Linha", subtitle: "Os 3 mais letais", players: rankingFieldPlayers, color: "#facc15" },
              { title: "Muralhas", subtitle: "Os guardiões imbatíveis", players: rankingGoalkeepers, color: "#fb923c" },
            ].map((group) => (
              <Card
                key={group.title}
                className="!rounded-3xl !border-[#22345e] !bg-[#020a22]/90 !shadow-xl !shadow-black/40"
                styles={{ body: { padding: 20 } }}
              >
                <div className="text-center mb-5">
                  <Title level={2} className="!text-white !m-0 !uppercase">{group.title}</Title>
                  <Text className="!text-xs !uppercase !tracking-[0.2em]" style={{ color: group.color }}>{group.subtitle}</Text>
                </div>

                <Row gutter={[16, 16]} justify="center">
                  {group.players.length > 0 ? group.players.map((player, index) => (
                    <Col xs={24} md={8} key={`${group.title}-${player.id}`}>
                      <Card
                        hoverable
                        className="!rounded-[26px] !border-[#c5aa5b] !bg-gradient-to-b !from-[#f7e7b0] !via-[#e8cf89] !to-[#c7a85a] !shadow-2xl !shadow-amber-900/35 transition-all duration-300 hover:!-translate-y-1"
                        styles={{ body: { padding: 14 } }}
                        style={{ clipPath: "polygon(0 0, 100% 0, 100% 93%, 50% 100%, 0 93%)" }}
                        onClick={() => setSelectedPlayer(player)}
                      >
                        <div className="rounded-2xl border border-amber-900/20 bg-gradient-to-b from-[#f9eec8]/90 to-[#d4b26a]/90 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-4xl font-black leading-none text-[#2d2110]">{player.pivot?.overall ?? 0}</div>
                              <div className="text-xs font-bold uppercase tracking-wider text-[#4e3a1a]">{player.primary_position || "Linha"}</div>
                            </div>
                            <Tag color="gold" className="!mr-0 !border-amber-700 !text-[#3b2a11]">#{index + 1}</Tag>
                          </div>

                          <div className="mt-2 flex justify-center">
                            <Avatar src={player.avatar || undefined} size={92} className="!border-4 !border-amber-100 !bg-slate-700 !text-white">
                              {player.name?.[0]}
                            </Avatar>
                          </div>

                          <div className="mt-2 border-y border-amber-900/25 py-1 text-center text-base font-extrabold uppercase tracking-wide text-[#2f220f]">
                            {player.name}
                          </div>

                          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-bold text-[#3e2e14]">
                            <div className="flex justify-between"><span>PAC</span><span>{player.pivot?.velocidade ?? 0}</span></div>
                            <div className="flex justify-between"><span>SHO</span><span>{player.pivot?.finalizacao ?? 0}</span></div>
                            <div className="flex justify-between"><span>PAS</span><span>{player.pivot?.passe ?? 0}</span></div>
                            <div className="flex justify-between"><span>DRI</span><span>{player.pivot?.drible ?? 0}</span></div>
                            <div className="flex justify-between"><span>DEF</span><span>{player.pivot?.defesa ?? 0}</span></div>
                            <div className="flex justify-between"><span>PHY</span><span>{player.pivot?.fisico ?? 0}</span></div>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  )) : <Text className="!text-slate-400">Sem jogadores nessa categoria.</Text>}
                </Row>
              </Card>
            ))}

            <Row gutter={[16, 16]}>
              {rankingPlayers.map((player, index) => (
                <Col xs={24} md={12} lg={8} key={player.id}>
                  <Card
                    hoverable
                    className="!rounded-[26px] !border-[#c5aa5b] !bg-gradient-to-b !from-[#f7e7b0] !via-[#e8cf89] !to-[#c7a85a] !shadow-2xl !shadow-amber-900/35 transition-all duration-300 hover:!-translate-y-1"
                    styles={{ body: { padding: 14 } }}
                    style={{ clipPath: "polygon(0 0, 100% 0, 100% 93%, 50% 100%, 0 93%)" }}
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <div className="rounded-2xl border border-amber-900/20 bg-gradient-to-b from-[#f9eec8]/90 to-[#d4b26a]/90 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-4xl font-black leading-none text-[#2d2110]">{player.pivot?.overall ?? 0}</div>
                          <div className="text-xs font-bold uppercase tracking-wider text-[#4e3a1a]">{player.primary_position || "Linha"}</div>
                        </div>
                        <Tag color="gold" className="!mr-0 !border-amber-700 !text-[#3b2a11]">#{index + 1}</Tag>
                      </div>

                      <div className="mt-2 flex justify-center">
                        <Avatar src={player.avatar || undefined} size={92} className="!border-4 !border-amber-100 !bg-slate-700 !text-white">
                          {player.name?.[0]}
                        </Avatar>
                      </div>

                      <div className="mt-2 border-y border-amber-900/25 py-1 text-center text-base font-extrabold uppercase tracking-wide text-[#2f220f]">
                        {player.name}
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-bold text-[#3e2e14]">
                        <div className="flex justify-between"><span>PAC</span><span>{player.pivot?.velocidade ?? 0}</span></div>
                        <div className="flex justify-between"><span>SHO</span><span>{player.pivot?.finalizacao ?? 0}</span></div>
                        <div className="flex justify-between"><span>PAS</span><span>{player.pivot?.passe ?? 0}</span></div>
                        <div className="flex justify-between"><span>DRI</span><span>{player.pivot?.drible ?? 0}</span></div>
                        <div className="flex justify-between"><span>DEF</span><span>{player.pivot?.defesa ?? 0}</span></div>
                        <div className="flex justify-between"><span>PHY</span><span>{player.pivot?.fisico ?? 0}</span></div>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {activeTab === "tournaments" && (
          <div className="space-y-5">
            <Card className="!bg-slate-900/80 !border-slate-700 !rounded-2xl !shadow-xl !shadow-black/20">
              <Title level={4} className="!text-white">Central de Torneios</Title>
              <Text className="!text-slate-300">
                Crie partidas de torneio com fluxo guiado: escolha o torneio e selecione dois times já cadastrados.
              </Text>
              <div className="mt-3">
                <Alert
                  type="info"
                  showIcon
                  message="Regras da organização"
                  description="Cada torneio deve ter times pré-cadastrados. Ao criar um torneio, informe os times na mesma etapa."
                />
              </div>
            </Card>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}><Card className="!rounded-2xl"><Statistic title="Torneios ativos" value={tournaments.length} prefix={<TrophyOutlined />} /></Card></Col>
              <Col xs={24} md={8}><Card className="!rounded-2xl"><Statistic title="Partidas em torneios" value={matches.filter((m) => m.tournament_id).length} prefix={<FireOutlined />} /></Card></Col>
              <Col xs={24} md={8}><Card className="!rounded-2xl"><Statistic title="Jogadores da org" value={organization.players?.length || 0} prefix={<UserOutlined />} /></Card></Col>
            </Row>

            <Row gutter={[16, 16]}>
              {tournaments.map((tournament) => {
                const tournamentMatches = matches.filter((match) => match.tournament_id === tournament.id);
                const finishedCount = tournamentMatches.filter((match) => match.status === "finished").length;
                const teamCount = tournament.teams?.length ?? 0;
                const topTournamentPlayers = (tournament.teams ?? [])
                  .flatMap((team) => (team.players ?? []).map((player) => ({ ...player, teamName: team.name })))
                  .sort((a, b) => (b.pivot?.overall ?? 0) - (a.pivot?.overall ?? 0))
                  .slice(0, 3);

                return (
                  <Col xs={24} md={12} key={tournament.id}>
                    <Card hoverable className="!rounded-2xl !bg-slate-900/80 !border-slate-700 transition-all duration-300 hover:!-translate-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <Title level={4} className="!text-white !mb-1">{tournament.name}</Title>
                        <Space wrap>
                          <Button className={actionButtonClass} onClick={() => navigate(`/dashboard/org/${orgId}/tournaments/${tournament.id}`)}>Ver página</Button>
                          <Button className={actionButtonClass} onClick={() => viewTournamentMatches(tournament.id)}>Ver partidas</Button>
                          {isAdmin && (
                            <Button className={primaryButtonClass} type="primary" icon={<PlusOutlined />} onClick={() => openCreateMatchForTournament(tournament.id)} disabled={teamCount < 2}>
                              Criar partida
                            </Button>
                          )}
                        </Space>
                      </div>

                      <Space wrap className="mb-2">
                        <Tag color="blue">{tournament.type === "knockout" ? "Mata-mata" : "Liga"}</Tag>
                        {tournament.start_date && <Tag>{new Date(tournament.start_date).toLocaleDateString("pt-BR")}</Tag>}
                        <Tag color={teamCount >= 2 ? "green" : "red"}>{teamCount} times</Tag>
                      </Space>

                      <Text className="!text-[#95acd8]">Total de partidas: {tournamentMatches.length}</Text>
                      <br />
                      <Text className="!text-[#95acd8]">Finalizadas: {finishedCount}</Text>
                      <Progress
                        percent={tournamentMatches.length ? Math.round((finishedCount / tournamentMatches.length) * 100) : 0}
                        strokeColor="#22c55e"
                      />

                      <Divider className="!border-[#1f3a68] !my-3" />
                      <Text className="!text-[#82a1d2]">Times cadastrados</Text>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(tournament.teams ?? []).map((team) => <Tag key={team.id}>{team.name}</Tag>)}
                        {teamCount === 0 && <Tag color="warning">Sem times</Tag>}
                      </div>

                      <Divider className="!border-[#1f3a68] !my-3" />
                      <Text className="!text-[#82a1d2]">Top jogadores do torneio</Text>
                      <div className="mt-2 space-y-2">
                        {topTournamentPlayers.map((player, index) => (
                          <div key={`${tournament.id}-${player.id}`} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
                            <div className="min-w-0">
                              <Text className="!text-slate-100 !font-semibold">#{index + 1} {player.name}</Text>
                              <div><Text className="!text-xs !text-slate-400">{player.teamName}</Text></div>
                            </div>
                            <Tag color={index === 0 ? "gold" : "green"}>OVR {player.pivot?.overall ?? 0}</Tag>
                          </div>
                        ))}
                        {topTournamentPlayers.length === 0 && <Tag color="warning">Sem jogadores vinculados aos times</Tag>}
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
            {tournaments.length === 0 && <Empty description="Crie seu primeiro torneio" />}
          </div>
        )}
      </div>

      <Modal open={Boolean(selectedPlayer)} onCancel={() => setSelectedPlayer(null)} footer={null} title={null} centered>
        {selectedPlayer && (
          <div className="rounded-[30px] border border-[#bea85d] bg-gradient-to-b from-[#f8ebc0] via-[#e6cd8c] to-[#caa65e] p-4 text-[#2d210f]" style={{ clipPath: "polygon(0 0, 100% 0, 100% 94%, 50% 100%, 0 94%)" }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-6xl font-black leading-none">{selectedPlayer.pivot?.overall ?? 0}</div>
                <div className="text-xs font-bold uppercase tracking-[0.16em]">{selectedPlayer.primary_position || "Linha"}</div>
              </div>
              <Avatar src={selectedPlayer.avatar || undefined} size={84} className="!border-4 !border-amber-50 !bg-slate-700 !text-white">{selectedPlayer.name?.[0]}</Avatar>
            </div>

            <div className="mt-3 border-y border-amber-900/25 py-1 text-center text-xl font-black uppercase tracking-wide">{selectedPlayer.name}</div>

            <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1.5 text-sm font-extrabold">
              <div className="flex justify-between"><span>PAC</span><span>{selectedPlayer.pivot?.velocidade ?? 0}</span></div>
              <div className="flex justify-between"><span>SHO</span><span>{selectedPlayer.pivot?.finalizacao ?? 0}</span></div>
              <div className="flex justify-between"><span>PAS</span><span>{selectedPlayer.pivot?.passe ?? 0}</span></div>
              <div className="flex justify-between"><span>DRI</span><span>{selectedPlayer.pivot?.drible ?? 0}</span></div>
              <div className="flex justify-between"><span>DEF</span><span>{selectedPlayer.pivot?.defesa ?? 0}</span></div>
              <div className="flex justify-between"><span>PHY</span><span>{selectedPlayer.pivot?.fisico ?? 0}</span></div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs font-bold uppercase">
              <div className="rounded-lg border border-amber-900/20 bg-amber-50/40 p-2">⚽ Gols: {selectedPlayer.goals_total ?? 0}</div>
              <div className="rounded-lg border border-amber-900/20 bg-amber-50/40 p-2">🎯 Assist: {selectedPlayer.assists_total ?? 0}</div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(commentsModalMatch)}
        title={`Comentários - ${commentsModalMatch?.name || "Partida"}`}
        onCancel={() => setCommentsModalMatch(null)}
        footer={null}
      >
        {commentsLoading ? (
          <Spin />
        ) : (
          <List
            dataSource={comments}
            locale={{ emptyText: "Sem comentários ainda" }}
            renderItem={(comment) => (
              <List.Item
                actions={comment.player_id === user?.id ? [<Button danger type="link" className="!font-semibold" onClick={() => deleteComment(comment.id)}>Remover</Button>] : []}
              >
                <List.Item.Meta
                  avatar={<Avatar src={comment.player?.avatar || undefined}>{comment.player?.name?.[0]}</Avatar>}
                  title={comment.player?.name || "Jogador"}
                  description={comment.content}
                />
              </List.Item>
            )}
          />
        )}
        <Space.Compact className="w-full mt-3">
          <Input className="!rounded-l-xl !border-slate-600 !bg-slate-950/70 !text-slate-100" value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder="Comente a partida..." />
          <Button className={primaryButtonClass} type="primary" icon={<SendOutlined />} onClick={addComment}>Enviar</Button>
        </Space.Compact>
      </Modal>

      <Drawer
        open={Boolean(lineupMatch)}
        onClose={() => setLineupMatch(null)}
        title={`Escalação - ${lineupMatch?.name || "Partida"}`}
        width={680}
      >
        {lineupLoading ? (
          <Spin />
        ) : (
          <>
            <Card className="!mb-4 !rounded-2xl !bg-slate-900/80 !border-slate-700" size="small">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Text className="!text-[#8faedb]">Time A</Text>
                  <div className="text-lg font-semibold text-white">{lineupSummary.countA} jogadores</div>
                  <Text className="!text-emerald-300">Overall total: {lineupSummary.overallA}</Text>
                </div>
                <div>
                  <Text className="!text-[#8faedb]">Time B</Text>
                  <div className="text-lg font-semibold text-white">{lineupSummary.countB} jogadores</div>
                  <Text className="!text-cyan-300">Overall total: {lineupSummary.overallB}</Text>
                </div>
              </div>
              <Divider className="!my-3 !border-[#1e3760]" />
              <Space wrap>
                <Tag color={lineupSummary.isBalanced ? "green" : "orange"}>
                  {lineupSummary.isBalanced ? "Balanceamento bom" : `Diferença de OVR: ${lineupSummary.difference}`}
                </Tag>
                <Tag color={lineupSummary.unassigned === 0 ? "blue" : "warning"}>
                  Sem time: {lineupSummary.unassigned}
                </Tag>
              </Space>
            </Card>

            <Space wrap className="mb-3">
              {!isUserRegisteredInLineup ? (
                <Button className={primaryButtonClass} type="primary" onClick={registerInMatch}>Entrar na partida</Button>
              ) : (
                <Button className="!h-10 !rounded-xl !border-rose-400/40 !bg-rose-500/10 !px-4 !font-semibold !text-rose-200 hover:!bg-rose-500/20" danger onClick={leaveMatch}>Sair da partida</Button>
              )}
              {isAdmin && <Button className={actionButtonClass} onClick={randomizeTeams}>Sortear times</Button>}
              {isAdmin && <Button className={actionButtonClass} onClick={clearTeams}>Limpar times</Button>}
              {isAdmin && <Button className={primaryButtonClass} type="primary" onClick={saveLineup}>Salvar escalação</Button>}
            </Space>

            <Row gutter={12}>
              <Col span={12}>
                <Card title="Time A" size="small" className="!rounded-2xl !bg-slate-900/80 !border-slate-700">
                  <List
                    dataSource={lineupPlayers.filter((player) => teamAIds.includes(player.id))}
                    locale={{ emptyText: "Sem jogadores" }}
                    renderItem={(player) => (
                      <List.Item actions={isAdmin ? [<Button type="link" className="!font-semibold !text-cyan-300" onClick={() => movePlayerTo(player.id, "B")}>Mover</Button>] : []}>
                        <Space>
                          <Text className="!text-white">{player.name}</Text>
                          <Tag color="green">OVR {player.pivot?.overall ?? 0}</Tag>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Time B" size="small" className="!rounded-2xl !bg-slate-900/80 !border-slate-700">
                  <List
                    dataSource={lineupPlayers.filter((player) => teamBIds.includes(player.id))}
                    locale={{ emptyText: "Sem jogadores" }}
                    renderItem={(player) => (
                      <List.Item actions={isAdmin ? [<Button type="link" className="!font-semibold !text-cyan-300" onClick={() => movePlayerTo(player.id, "A")}>Mover</Button>] : []}>
                        <Space>
                          <Text className="!text-white">{player.name}</Text>
                          <Tag color="cyan">OVR {player.pivot?.overall ?? 0}</Tag>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>

            <Divider>Jogadores sem time</Divider>
            <List
              dataSource={lineupPlayers.filter((player) => !teamAIds.includes(player.id) && !teamBIds.includes(player.id))}
              locale={{ emptyText: "Todos os jogadores já estão nos times" }}
              renderItem={(player) => (
                <List.Item
                  actions={isAdmin ? [
                    <Button type="link" className="!font-semibold !text-emerald-300" onClick={() => movePlayerTo(player.id, "A")}>Time A</Button>,
                    <Button type="link" className="!font-semibold !text-cyan-300" onClick={() => movePlayerTo(player.id, "B")}>Time B</Button>,
                  ] : []}
                >
                  {player.name}
                </List.Item>
              )}
            />
          </>
        )}
      </Drawer>

      <Modal open={isCreateMatchOpen} onCancel={() => setIsCreateMatchOpen(false)} footer={null} title="Criar partida">
        <form className="space-y-3" onSubmit={submitCreateMatch}>
          <Input className="!rounded-xl !border-slate-600 !bg-slate-950/70 !text-slate-100" value={newMatchName} onChange={(event) => setNewMatchName(event.target.value)} placeholder="Nome da partida" />
          <Input className="!rounded-xl !border-slate-600 !bg-slate-950/70 !text-slate-100" type="date" value={newMatchDate} onChange={(event) => setNewMatchDate(event.target.value)} required />
          <Select
            value={newMatchTournamentId}
            onChange={setNewMatchTournamentId}
            style={{ width: "100%" }}
            className="[&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!border-slate-600 [&_.ant-select-selector]:!bg-slate-950/70 [&_.ant-select-selector]:!text-slate-100"
            options={[
              { value: "none", label: "Partida amistosa (sem torneio)" },
              ...tournaments.map((tournament) => ({ value: String(tournament.id), label: tournament.name })),
            ]}
          />

          {newMatchTournamentId !== "none" && (
            <>
              <Text className="!text-[#7b93bf]">Escolha os times pré-cadastrados no torneio</Text>
              {selectedTournamentTeams.length === 0 && (
                <Alert
                  type="warning"
                  showIcon
                  message="Esse torneio ainda não possui times cadastrados."
                />
              )}
              <Select
                placeholder="Time A"
                value={newMatchTeamAId || undefined}
                onChange={setNewMatchTeamAId}
                style={{ width: "100%" }}
                className="[&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!border-slate-600 [&_.ant-select-selector]:!bg-slate-950/70 [&_.ant-select-selector]:!text-slate-100"
                options={selectedTournamentTeamOptions}
              />
              <Select
                placeholder="Time B"
                value={newMatchTeamBId || undefined}
                onChange={setNewMatchTeamBId}
                style={{ width: "100%" }}
                className="[&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!border-slate-600 [&_.ant-select-selector]:!bg-slate-950/70 [&_.ant-select-selector]:!text-slate-100"
                options={selectedTournamentTeamOptions.filter((team) => team.value !== newMatchTeamAId)}
              />
              {(selectedTeamAData || selectedTeamBData) && (
                <Alert
                  type="info"
                  showIcon
                  message="Resumo dos elencos selecionados"
                  description={
                    <Space direction="vertical" size={4}>
                      {selectedTeamAData && (
                        <Text className="!text-slate-200">
                          {selectedTeamAData.name}: {selectedTeamAData.players?.length ?? 0} jogadores • Técnico: {selectedTeamAData.coach?.name ?? "Não definido"}
                        </Text>
                      )}
                      {selectedTeamBData && (
                        <Text className="!text-slate-200">
                          {selectedTeamBData.name}: {selectedTeamBData.players?.length ?? 0} jogadores • Técnico: {selectedTeamBData.coach?.name ?? "Não definido"}
                        </Text>
                      )}
                    </Space>
                  }
                />
              )}
            </>
          )}

          <Button className={primaryButtonClass} type="primary" htmlType="submit" loading={isBusy} block>Criar partida</Button>
        </form>
      </Modal>

      <Modal open={isCreateTournamentOpen} onCancel={() => setIsCreateTournamentOpen(false)} footer={null} title="Criar torneio">
        <form className="space-y-3" onSubmit={submitCreateTournament}>
          <Input className="!rounded-xl !border-slate-600 !bg-slate-950/70 !text-slate-100" value={newTournamentName} onChange={(event) => setNewTournamentName(event.target.value)} placeholder="Nome" required />
          <Select
            value={newTournamentType}
            className="[&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!border-slate-600 [&_.ant-select-selector]:!bg-slate-950/70 [&_.ant-select-selector]:!text-slate-100"
            onChange={(value) => setNewTournamentType(value as TournamentType)}
            options={[{ label: "Liga", value: "league" }, { label: "Mata-mata", value: "knockout" }]}
          />
          <Input className="!rounded-xl !border-slate-600 !bg-slate-950/70 !text-slate-100" type="date" value={newTournamentStartDate} onChange={(event) => setNewTournamentStartDate(event.target.value)} />
          <Select
            mode="tags"
            value={newTournamentTeams}
            onChange={setNewTournamentTeams}
            tokenSeparators={[",", ";"]}
            placeholder="Times pré-cadastrados (mínimo 2)"
            style={{ width: "100%" }}
            className="[&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!border-slate-600 [&_.ant-select-selector]:!bg-slate-950/70 [&_.ant-select-selector]:!text-slate-100"
          />
          <Space wrap>
            <Button className={actionButtonClass} type="default" onClick={importPresetNamesToTournament} disabled={teamPresets.length === 0}>
              Importar times da organização
            </Button>
            <Text className="!text-slate-400">{teamPresets.length} time(s) pré-cadastrado(s) disponível(is)</Text>
          </Space>
          <Button className={primaryButtonClass} type="primary" htmlType="submit" loading={isBusy} block>Criar torneio com times</Button>
        </form>
      </Modal>

      <Modal open={isPresetModalOpen} onCancel={() => setIsPresetModalOpen(false)} footer={null} title="Times pré-cadastrados da organização">
        <div className="space-y-3">
          <Input
            className="!rounded-xl !border-slate-600 !bg-slate-950/70 !text-slate-100"
            placeholder="Nome do time base"
            value={presetName}
            onChange={(event) => setPresetName(event.target.value)}
          />
          <Select
            mode="multiple"
            value={presetPlayerIds}
            onChange={(values) => setPresetPlayerIds((values as number[]).map((value) => Number(value)))}
            placeholder="Jogadores do time base"
            style={{ width: "100%" }}
            options={(organization?.players ?? []).map((player) => ({ label: player.name, value: Number(player.id) }))}
            optionFilterProp="label"
            showSearch
          />
          <Select
            allowClear
            value={presetCoachId ?? undefined}
            onChange={(value) => setPresetCoachId(value ? Number(value) : null)}
            placeholder="Técnico do time base"
            style={{ width: "100%" }}
            options={(organization?.players ?? []).map((player) => ({ label: player.name, value: Number(player.id) }))}
            optionFilterProp="label"
            showSearch
          />
          <Button className={primaryButtonClass} type="primary" onClick={upsertTeamPreset} block>
            Salvar time pré-cadastrado
          </Button>

          <Divider className="!my-2" />
          <List
            dataSource={teamPresets}
            locale={{ emptyText: "Nenhum time pré-cadastrado ainda." }}
            renderItem={(preset) => (
              <List.Item
                actions={[
                  <Button
                    key={`use-${preset.id}`}
                    type="link"
                    className="!text-cyan-300"
                    onClick={() => {
                      setNewTournamentTeams((current) => Array.from(new Set([...current, preset.name])));
                      messageApi.success(`${preset.name} adicionado aos times do torneio.`);
                    }}
                  >
                    Usar no torneio
                  </Button>,
                  <Button key={`remove-${preset.id}`} type="link" danger onClick={() => removeTeamPreset(preset.id)}>
                    Remover
                  </Button>,
                ]}
              >
                <Space direction="vertical" size={0}>
                  <Text className="!text-white">{preset.name}</Text>
                  <Text className="!text-slate-400 !text-xs">Jogadores base: {preset.playerIds.length} • Técnico: {(organization?.players ?? []).find((p) => p.id === preset.coachId)?.name ?? "Não definido"}</Text>
                </Space>
              </List.Item>
            )}
          />
        </div>
      </Modal>

    </div>
  );
}
