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

type MatchStatus = "open" | "in_progress" | "finished";
type DashboardTab = "open" | "pending" | "finished" | "ranking" | "tournaments";
type TournamentType = "league" | "knockout";

interface TeamData {
  id: number;
  tournament_id: number;
  name: string;
  logo?: string | null;
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
  const [newMatchName, setNewMatchName] = useState("Partida de torneio");
  const [newMatchTournamentId, setNewMatchTournamentId] = useState<string>("none");
  const [newMatchTeamAId, setNewMatchTeamAId] = useState<string>("");
  const [newMatchTeamBId, setNewMatchTeamBId] = useState<string>("");

  const [newTournamentName, setNewTournamentName] = useState("");
  const [newTournamentType, setNewTournamentType] = useState<TournamentType>("league");
  const [newTournamentStartDate, setNewTournamentStartDate] = useState("");
  const [newTournamentTeams, setNewTournamentTeams] = useState<string[]>([]);

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
    fetchDashboardData();
  }, [orgId]);

  useEffect(() => {
    setNewMatchTeamAId("");
    setNewMatchTeamBId("");
  }, [newMatchTournamentId]);

  const userOnOrg = useMemo(
    () => organization?.players?.find((player) => player.id === user?.id),
    [organization?.players, user?.id],
  );

  const userOverall = userOnOrg?.pivot?.overall ?? 0;
  const isAdmin = Boolean(userOnOrg?.pivot?.is_admin);

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

  const tournamentById = useMemo(
    () => new Map(tournaments.map((tournament) => [tournament.id, tournament])),
    [tournaments],
  );

  const selectedMatchTournament = useMemo(() => {
    if (newMatchTournamentId === "none") return null;
    return tournamentById.get(Number(newMatchTournamentId)) ?? null;
  }, [newMatchTournamentId, tournamentById]);

  const selectedTournamentTeams = selectedMatchTournament?.teams ?? [];

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

  const submitCreateMatch = async (event: FormEvent) => {
    event.preventDefault();
    if (!orgId || !newMatchDate) return;

    const isTournamentMatch = newMatchTournamentId !== "none";
    if (isTournamentMatch && (!newMatchTeamAId || !newMatchTeamBId)) {
      messageApi.warning("Selecione os dois times para a partida do torneio.");
      return;
    }

    setIsBusy(true);
    try {
      await api.post("/matches", {
        organization_id: Number(orgId),
        name: newMatchName.trim() || "Rachão Futclebs",
        match_date: formatDateForApi(newMatchDate),
        tournament_id: isTournamentMatch ? Number(newMatchTournamentId) : null,
        team_a_id: isTournamentMatch ? Number(newMatchTeamAId) : null,
        team_b_id: isTournamentMatch ? Number(newMatchTeamBId) : null,
      });
      setNewMatchDate("");
      setNewMatchName("Partida de torneio");
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
      const response = await api.post("/tournaments", {
        organization_id: Number(orgId),
        name: newTournamentName.trim(),
        type: newTournamentType,
        start_date: newTournamentStartDate || null,
      });

      const payload = response.data?.data ?? response.data;
      const tournamentId = payload?.id;

      if (!tournamentId) {
        throw new Error("Torneio sem ID retornado");
      }

      await Promise.all(
        validTeams.map((teamName) =>
          api.post("/teams", {
            tournament_id: tournamentId,
            name: teamName,
          }),
        ),
      );

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
      <div className="min-h-screen bg-[#020b22] text-white flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!organization) {
    return <div className="min-h-screen bg-[#020b22] text-white flex items-center justify-center">Sem dados.</div>;
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
    <div className="min-h-screen bg-gradient-to-br from-[#030a1e] via-[#06193f] to-[#03142e] text-white">
      {contextHolder}
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Text className="!text-[#7c93bf] !uppercase !tracking-[0.2em]">Futclebs • Organização</Text>
            <Title level={2} className="!text-white !m-0">{user?.name}</Title>
            <Text className="!text-[#9bb1d9]">{organization.name}</Text>
          </div>

          <Space wrap>
            <Button icon={<PlusOutlined />} onClick={() => setIsCreateTournamentOpen(true)} disabled={!isAdmin}>
              Novo torneio
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setNewMatchTournamentId("none");
                setNewMatchName("Partida amistosa");
                setIsCreateMatchOpen(true);
              }}
              disabled={!isAdmin}
            >
              Nova partida
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchDashboardData}>Atualizar</Button>
            <Button onClick={() => navigate("/dashboard")}>Voltar</Button>
          </Space>
        </div>

        <Card className="!bg-gradient-to-r !from-[#1e9d72] !to-[#1572a6] !border-0 !rounded-2xl">
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

        <Segmented block options={tabItems} value={activeTab} onChange={(value) => setActiveTab(value as DashboardTab)} />

        {(activeTab === "open" || activeTab === "finished" || activeTab === "pending") && (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Text className="!text-[#9ab7ea]">Filtro de torneio:</Text>
              <Select
                value={matchTournamentFilter}
                onChange={setMatchTournamentFilter}
                style={{ minWidth: 260 }}
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
                  className="!bg-[#04173b] !border-[#203254] !rounded-2xl transition-all duration-300 hover:!-translate-y-1 hover:!shadow-2xl"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Title level={4} className="!text-white !m-0">{match.name || "Pelada Futclebs"}</Title>
                      <Text className="!text-[#8ea4cf]"><CalendarOutlined /> {formatDateTimeLabel(match.match_date)}</Text>
                      {tournament && <div><Tag color="cyan">Torneio: {tournament.name}</Tag></div>}
                      {teamA && teamB && <div><Tag color="purple">{teamA.name} x {teamB.name}</Tag></div>}
                    </div>
                    <Space wrap>
                      <Tag color={match.status === "finished" ? "default" : "green"}>{match.status}</Tag>
                      <Button icon={<TeamOutlined />} onClick={() => openLineupDrawer(match)}>Escalação</Button>
                      <Button icon={<CommentOutlined />} onClick={() => openCommentsModal(match)}>Comentários</Button>
                    </Space>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {activeTab === "ranking" && (
          <div className="space-y-4">
            <Space wrap>
              <Input placeholder="Buscar jogador" value={rankingSearch} onChange={(e) => setRankingSearch(e.target.value)} />
              <Select
                value={rankingPositionFilter}
                onChange={setRankingPositionFilter}
                options={[
                  { label: "Todas as posições", value: "all" },
                  ...uniquePositions.map((position) => ({ label: position, value: position })),
                ]}
                style={{ minWidth: 220 }}
              />
            </Space>

            <Row gutter={[16, 16]}>
              {rankingPlayers.map((player, index) => (
                <Col xs={24} md={12} lg={8} key={player.id}>
                  <Card
                    hoverable
                    className="!bg-[#071c45] !border-[#1f3d74] !rounded-2xl"
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <Text className="!text-[#7ea3e5]">#{index + 1}</Text>
                    <Title level={5} className="!text-white !mb-1">{player.name}</Title>
                    <Text className="!text-[#7992bd]">{player.primary_position || "Linha"}</Text>
                    <Title level={3} className="!text-emerald-400 !m-0">{player.pivot?.overall ?? 0}</Title>
                    <Progress
                      percent={Math.min(player.pivot?.overall ?? 0, 100)}
                      showInfo={false}
                      strokeColor="#36d399"
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {activeTab === "tournaments" && (
          <div className="space-y-5">
            <Card className="!bg-[#071737] !border-[#214378] !rounded-2xl">
              <Title level={4} className="!text-white">Central de Torneios</Title>
              <Text className="!text-[#9ab7ea]">
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

                return (
                  <Col xs={24} md={12} key={tournament.id}>
                    <Card hoverable className="!rounded-2xl !bg-[#061b3f] !border-[#1c3b70] transition-all duration-300 hover:!-translate-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <Title level={4} className="!text-white !mb-1">{tournament.name}</Title>
                        <Space wrap>
                          <Button onClick={() => navigate(`/dashboard/org/${orgId}/tournaments/${tournament.id}`)}>Ver página</Button>
                          <Button onClick={() => viewTournamentMatches(tournament.id)}>Ver partidas</Button>
                          <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreateMatchForTournament(tournament.id)} disabled={!isAdmin || teamCount < 2}>
                            Criar partida
                          </Button>
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
                    </Card>
                  </Col>
                );
              })}
            </Row>
            {tournaments.length === 0 && <Empty description="Crie seu primeiro torneio" />}
          </div>
        )}
      </div>

      <Modal open={Boolean(selectedPlayer)} onCancel={() => setSelectedPlayer(null)} footer={null} title={selectedPlayer?.name}>
        {selectedPlayer && (
          <List
            size="small"
            dataSource={[
              `Posição: ${selectedPlayer.primary_position || "Linha"}`,
              `OVR: ${selectedPlayer.pivot?.overall ?? 0}`,
              `Gols: ${selectedPlayer.goals_total ?? 0}`,
              `Assistências: ${selectedPlayer.assists_total ?? 0}`,
              `Passe: ${selectedPlayer.pivot?.passe ?? 0}`,
              `Drible: ${selectedPlayer.pivot?.drible ?? 0}`,
            ]}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />
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
                actions={comment.player_id === user?.id ? [<Button danger type="link" onClick={() => deleteComment(comment.id)}>Remover</Button>] : []}
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
          <Input value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder="Comente a partida..." />
          <Button type="primary" icon={<SendOutlined />} onClick={addComment}>Enviar</Button>
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
            <Card className="!mb-4 !rounded-2xl !bg-[#071737] !border-[#22406f]" size="small">
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
                <Button type="primary" onClick={registerInMatch}>Entrar na partida</Button>
              ) : (
                <Button danger onClick={leaveMatch}>Sair da partida</Button>
              )}
              {isAdmin && <Button onClick={randomizeTeams}>Sortear times</Button>}
              {isAdmin && <Button onClick={clearTeams}>Limpar times</Button>}
              {isAdmin && <Button type="primary" onClick={saveLineup}>Salvar escalação</Button>}
            </Space>

            <Row gutter={12}>
              <Col span={12}>
                <Card title="Time A" size="small" className="!rounded-2xl !bg-[#061b3f] !border-[#1c3b70]">
                  <List
                    dataSource={lineupPlayers.filter((player) => teamAIds.includes(player.id))}
                    locale={{ emptyText: "Sem jogadores" }}
                    renderItem={(player) => (
                      <List.Item actions={isAdmin ? [<Button type="link" onClick={() => movePlayerTo(player.id, "B")}>Mover</Button>] : []}>
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
                <Card title="Time B" size="small" className="!rounded-2xl !bg-[#061b3f] !border-[#1c3b70]">
                  <List
                    dataSource={lineupPlayers.filter((player) => teamBIds.includes(player.id))}
                    locale={{ emptyText: "Sem jogadores" }}
                    renderItem={(player) => (
                      <List.Item actions={isAdmin ? [<Button type="link" onClick={() => movePlayerTo(player.id, "A")}>Mover</Button>] : []}>
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
                    <Button type="link" onClick={() => movePlayerTo(player.id, "A")}>Time A</Button>,
                    <Button type="link" onClick={() => movePlayerTo(player.id, "B")}>Time B</Button>,
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
          <Input value={newMatchName} onChange={(event) => setNewMatchName(event.target.value)} placeholder="Nome da partida" />
          <Input type="date" value={newMatchDate} onChange={(event) => setNewMatchDate(event.target.value)} required />
          <Select
            value={newMatchTournamentId}
            onChange={setNewMatchTournamentId}
            style={{ width: "100%" }}
            options={[
              { value: "none", label: "Partida amistosa (sem torneio)" },
              ...tournaments.map((tournament) => ({ value: String(tournament.id), label: tournament.name })),
            ]}
          />

          {newMatchTournamentId !== "none" && (
            <>
              <Text className="!text-[#7b93bf]">Escolha os times pré-cadastrados no torneio</Text>
              <Select
                placeholder="Time A"
                value={newMatchTeamAId || undefined}
                onChange={setNewMatchTeamAId}
                style={{ width: "100%" }}
                options={selectedTournamentTeams.map((team) => ({ value: String(team.id), label: team.name }))}
              />
              <Select
                placeholder="Time B"
                value={newMatchTeamBId || undefined}
                onChange={setNewMatchTeamBId}
                style={{ width: "100%" }}
                options={selectedTournamentTeams
                  .filter((team) => String(team.id) !== newMatchTeamAId)
                  .map((team) => ({ value: String(team.id), label: team.name }))}
              />
            </>
          )}

          <Button type="primary" htmlType="submit" loading={isBusy} block>Criar partida</Button>
        </form>
      </Modal>

      <Modal open={isCreateTournamentOpen} onCancel={() => setIsCreateTournamentOpen(false)} footer={null} title="Criar torneio">
        <form className="space-y-3" onSubmit={submitCreateTournament}>
          <Input value={newTournamentName} onChange={(event) => setNewTournamentName(event.target.value)} placeholder="Nome" required />
          <Select
            value={newTournamentType}
            onChange={(value) => setNewTournamentType(value as TournamentType)}
            options={[{ label: "Liga", value: "league" }, { label: "Mata-mata", value: "knockout" }]}
          />
          <Input type="date" value={newTournamentStartDate} onChange={(event) => setNewTournamentStartDate(event.target.value)} />
          <Select
            mode="tags"
            value={newTournamentTeams}
            onChange={setNewTournamentTeams}
            tokenSeparators={[",", ";"]}
            placeholder="Times pré-cadastrados (mínimo 2)"
            style={{ width: "100%" }}
          />
          <Button type="primary" htmlType="submit" loading={isBusy} block>Criar torneio com times</Button>
        </form>
      </Modal>
    </div>
  );
}
