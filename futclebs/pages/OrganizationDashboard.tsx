import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/services/axios";
import {
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
  AimOutlined,
  BarChartOutlined,
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

interface MatchData {
  id: number;
  name?: string;
  match_date: string;
  status: MatchStatus;
  tournament_id?: number | null;
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
  const [newMatchName, setNewMatchName] = useState("Pelada Futclebs");
  const [newMatchTournamentId, setNewMatchTournamentId] = useState<string>("none");
  const [newTournamentName, setNewTournamentName] = useState("");
  const [newTournamentType, setNewTournamentType] = useState<TournamentType>("league");
  const [newTournamentStartDate, setNewTournamentStartDate] = useState("");

  const [rankingSearch, setRankingSearch] = useState("");
  const [rankingPositionFilter, setRankingPositionFilter] = useState("all");
  const [selectedPlayer, setSelectedPlayer] = useState<OrganizationPlayer | null>(null);

  const [commentsModalMatch, setCommentsModalMatch] = useState<MatchData | null>(null);
  const [comments, setComments] = useState<MatchComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [lineupMatch, setLineupMatch] = useState<MatchData | null>(null);
  const [lineupPlayers, setLineupPlayers] = useState<OrganizationPlayer[]>([]);
  const [teamAIds, setTeamAIds] = useState<number[]>([]);
  const [teamBIds, setTeamBIds] = useState<number[]>([]);
  const [lineupLoading, setLineupLoading] = useState(false);
  const [clubEnergy, setClubEnergy] = useState(72);

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

  const dynamicHighlights = useMemo(
    () => [
      {
        title: "Ritmo da Semana",
        value: `${openMatches.length} jogos abertos`,
        tone: "bg-cyan-500/10 border-cyan-400/20 text-cyan-200",
      },
      {
        title: "Engajamento",
        value: `${pendingMatches.length} votações pendentes`,
        tone: "bg-amber-500/10 border-amber-400/20 text-amber-200",
      },
      {
        title: "Elenco Ativo",
        value: `${organization?.players?.length ?? 0} jogadores`,
        tone: "bg-emerald-500/10 border-emerald-400/20 text-emerald-200",
      },
    ],
    [openMatches.length, pendingMatches.length, organization?.players?.length],
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
      setClubEnergy((current) => Math.min(100, current + 3));
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
      setTeamAIds(payload?.result?.players_team_a ?? []);
      setTeamBIds(payload?.result?.players_team_b ?? []);
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
    await api.post(`/matches/${lineupMatch.id}/players/${user.id}`);
    setClubEnergy((current) => Math.min(100, current + 4));
    await openLineupDrawer(lineupMatch);
    await fetchDashboardData();
  };

  const leaveMatch = async () => {
    if (!lineupMatch || !user) return;
    await api.delete(`/matches/${lineupMatch.id}/players/${user.id}`);
    await openLineupDrawer(lineupMatch);
    await fetchDashboardData();
  };

  const randomizeTeams = () => {
    const ids = lineupPlayers.map((player) => player.id).sort(() => Math.random() - 0.5);
    const half = Math.ceil(ids.length / 2);
    setTeamAIds(ids.slice(0, half));
    setTeamBIds(ids.slice(half));
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
    try {
      await api.put(`/matches/${lineupMatch.id}/result`, {
        players_team_a: teamAIds,
        players_team_b: teamBIds,
      });
      messageApi.success("Escalações salvas com sucesso.");
    } catch {
      await api.post(`/matches/${lineupMatch.id}/result`, {
        players_team_a: teamAIds,
        players_team_b: teamBIds,
      });
      messageApi.success("Escalações salvas com sucesso.");
    }
  };

  const submitCreateMatch = async (event: FormEvent) => {
    event.preventDefault();
    if (!orgId || !newMatchDate) return;
    setIsBusy(true);
    try {
      await api.post("/matches", {
        organization_id: Number(orgId),
        name: newMatchName.trim() || "Rachão Futclebs",
        match_date: formatDateForApi(newMatchDate),
        tournament_id: newMatchTournamentId === "none" ? null : Number(newMatchTournamentId),
      });
      setNewMatchDate("");
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
    if (!orgId || !newTournamentName.trim()) return;
    setIsBusy(true);
    try {
      await api.post("/tournaments", {
        organization_id: Number(orgId),
        name: newTournamentName.trim(),
        type: newTournamentType,
        start_date: newTournamentStartDate || null,
      });
      setNewTournamentName("");
      setIsCreateTournamentOpen(false);
      messageApi.success("Torneio criado com sucesso.");
      await fetchDashboardData();
    } catch {
      messageApi.error("Não foi possível criar o torneio.");
    } finally {
      setIsBusy(false);
    }
  };

  const tabItems = [
    { label: `Abertas (${openMatches.length})`, value: "open" },
    { label: `Votar (${pendingMatches.length})`, value: "pending" },
    { label: `Histórico (${finishedMatches.length})`, value: "finished" },
    { label: `Ranking (${rankingPlayers.length})`, value: "ranking" },
    { label: `Torneios (${tournaments.length})`, value: "tournaments" },
  ];

  const dynamicInsights = useMemo(
    () => [
      {
        title: "Energia do elenco",
        value: `${clubEnergy}%`,
        hint: "Aumenta com inscrições e comentários",
        icon: <AimOutlined />,
      },
      {
        title: "Engajamento de partidas",
        value: `${Math.min(100, openMatches.length * 20 + finishedMatches.length * 8)}%`,
        hint: "Com base em partidas abertas e finalizadas",
        icon: <BarChartOutlined />,
      },
      {
        title: "Potencial competitivo",
        value: `${Math.min(100, Math.round((rankingPlayers[0]?.pivot?.overall ?? 0) * 1.1))}%`,
        hint: "Projeção da força do seu top 1",
        icon: <TrophyOutlined />,
      },
    ],
    [clubEnergy, openMatches.length, finishedMatches.length, rankingPlayers],
  );

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

  const uniquePositions = Array.from(new Set((organization.players ?? []).map((player) => player.primary_position || "Linha")));
  const activeMatches = activeTab === "open" ? openMatches : activeTab === "finished" ? finishedMatches : pendingMatches;
  const isUserRegisteredInLineup = lineupPlayers.some((player) => player.id === user?.id);

  return (
    <div className="min-h-screen bg-[#020b22] text-white">
      {contextHolder}
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Text className="!text-[#7c93bf] !uppercase !tracking-[0.2em]">Futclebs • Dashboard</Text>
            <Title level={2} className="!text-white !m-0">{user?.name}</Title>
            <Text className="!text-[#9bb1d9]">{organization.name}</Text>
          </div>

          <Space wrap>
            <Button icon={<PlusOutlined />} onClick={() => setIsCreateTournamentOpen(true)} disabled={!isAdmin}>Criar torneio</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateMatchOpen(true)} disabled={!isAdmin}>Criar partida</Button>
            <Button icon={<ReloadOutlined />} onClick={fetchDashboardData}>Atualizar</Button>
            <Button onClick={() => navigate("/dashboard")}>Sair</Button>
          </Space>
        </div>

        <Card className="!bg-gradient-to-r !from-[#0f8d63] !to-[#0f6e8d] !border-0">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={16}>
              <Text className="!text-emerald-100 !uppercase">Seu nível</Text>
              <Title className="!text-white !m-0" level={1}>{userOverall} <span className="text-2xl">OVR</span></Title>
              <Tag color="green">{userOnOrg?.primary_position || "Linha"}</Tag>
            </Col>
            <Col xs={24} md={8}>
              <Statistic title="Partidas abertas" value={openMatches.length} valueStyle={{ color: "#fff" }} />
              <Statistic title="Histórico" value={finishedMatches.length} valueStyle={{ color: "#c7ffea" }} />
            </Col>
          </Row>
        </Card>

        <Row gutter={[16, 16]}>
          {dynamicInsights.map((insight) => (
            <Col xs={24} md={8} key={insight.title}>
              <Card className="transition-all duration-300 hover:!-translate-y-1 hover:!shadow-xl">
                <Space className="w-full justify-between">
                  <div>
                    <Text type="secondary">{insight.title}</Text>
                    <Title level={4} className="!m-0">{insight.value}</Title>
                  </div>
                  {insight.icon}
                </Space>
                <Text className="!text-xs">{insight.hint}</Text>
              </Card>
            </Col>
          ))}
        </Row>

        <Segmented block options={tabItems} value={activeTab} onChange={(value) => setActiveTab(value as DashboardTab)} />

        <Row gutter={[12, 12]}>
          {dynamicHighlights.map((highlight) => (
            <Col xs={24} md={8} key={highlight.title}>
              <Card className={`!border ${highlight.tone} transition-all duration-300 hover:!-translate-y-1`}>
                <Text className="!text-slate-300">{highlight.title}</Text>
                <Title level={4} className="!mb-0 !text-white">{highlight.value}</Title>
              </Card>
            </Col>
          ))}
        </Row>

        {(activeTab === "open" || activeTab === "finished" || activeTab === "pending") && (
          <div className="grid gap-4">
            {activeMatches.length === 0 && <Empty description="Nenhuma partida encontrada" />}
            {activeMatches.map((match) => {
              const tournamentName = tournaments.find((tournament) => tournament.id === match.tournament_id)?.name;
              return (
                <Card
                  key={match.id}
                  hoverable
                  className="!bg-[#04173b] !border-[#203254] transition-all duration-300 hover:!-translate-y-1 hover:!shadow-2xl"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Title level={4} className="!text-white !m-0">{match.name || "Pelada Futclebs"}</Title>
                      <Text className="!text-[#8ea4cf]"><CalendarOutlined /> {formatDateTimeLabel(match.match_date)}</Text>
                      {tournamentName && <div><Tag color="cyan">Torneio: {tournamentName}</Tag></div>}
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
                options={[{ label: "Todas as posições", value: "all" }, ...uniquePositions.map((p) => ({ label: p, value: p }))]}
                style={{ minWidth: 220 }}
              />
            </Space>

            <Row gutter={[16, 16]}>
              {rankingPlayers.map((player, index) => (
                <Col xs={24} md={12} lg={8} key={player.id}>
                  <Card
                    hoverable
                    onClick={() => setSelectedPlayer(player)}
                    className="!bg-[#04173b] !border-[#1f3358] transition-all duration-300 hover:!-translate-y-1"
                  >
                    <Text className="!text-[#9fb5db]">#{index + 1}</Text>
                    <Title level={5} className="!text-white !mb-1">{player.name}</Title>
                    <Text className="!text-[#7992bd]">{player.primary_position || "Linha"}</Text>
                    <Title level={3} className="!text-emerald-400 !m-0">{player.pivot?.overall ?? 0}</Title>
                    <Progress percent={Math.min(player.pivot?.overall ?? 0, 100)} showInfo={false} strokeColor="#36d399" />
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {activeTab === "tournaments" && (
          <div className="space-y-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}><Card><Statistic title="Torneios ativos" value={tournaments.length} prefix={<TrophyOutlined />} /></Card></Col>
              <Col xs={24} md={8}><Card><Statistic title="Partidas em torneios" value={matches.filter((m) => m.tournament_id).length} prefix={<FireOutlined />} /></Card></Col>
              <Col xs={24} md={8}><Card><Statistic title="Jogadores da org" value={organization.players?.length || 0} prefix={<UserOutlined />} /></Card></Col>
            </Row>

            <Row gutter={[16, 16]}>
              {tournaments.map((tournament) => {
                const tournamentMatches = matches.filter((match) => match.tournament_id === tournament.id);
                const finishedCount = tournamentMatches.filter((match) => match.status === "finished").length;
                return (
                  <Col xs={24} md={12} key={tournament.id}>
                    <Card hoverable className="transition-all duration-300 hover:!-translate-y-1">
                      <Title level={4}>{tournament.name}</Title>
                      <Space wrap>
                        <Tag color="blue">{tournament.type === "knockout" ? "Mata-mata" : "Liga"}</Tag>
                        {tournament.start_date && <Tag>{new Date(tournament.start_date).toLocaleDateString("pt-BR")}</Tag>}
                      </Space>
                      <Divider />
                      <Text>Total de partidas: {tournamentMatches.length}</Text><br />
                      <Text>Finalizadas: {finishedCount}</Text>
                      <Progress percent={tournamentMatches.length ? Math.round((finishedCount / tournamentMatches.length) * 100) : 0} />
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
        width={560}
      >
        {lineupLoading ? (
          <Spin />
        ) : (
          <>
            <Space wrap className="mb-3">
              {!isUserRegisteredInLineup ? (
                <Button type="primary" onClick={registerInMatch}>Entrar na partida</Button>
              ) : (
                <Button danger onClick={leaveMatch}>Sair da partida</Button>
              )}
              {isAdmin && <Button onClick={randomizeTeams}>Sortear times</Button>}
              {isAdmin && <Button type="primary" onClick={saveLineup}>Salvar escalação</Button>}
            </Space>

            <Row gutter={12}>
              <Col span={12}>
                <Card title="Time A" size="small">
                  <List
                    dataSource={lineupPlayers.filter((player) => teamAIds.includes(player.id))}
                    locale={{ emptyText: "Sem jogadores" }}
                    renderItem={(player) => (
                      <List.Item actions={isAdmin ? [<Button type="link" onClick={() => movePlayerTo(player.id, "B")}>Mover</Button>] : []}>{player.name}</List.Item>
                    )}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Time B" size="small">
                  <List
                    dataSource={lineupPlayers.filter((player) => teamBIds.includes(player.id))}
                    locale={{ emptyText: "Sem jogadores" }}
                    renderItem={(player) => (
                      <List.Item actions={isAdmin ? [<Button type="link" onClick={() => movePlayerTo(player.id, "A")}>Mover</Button>] : []}>{player.name}</List.Item>
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
              { value: "none", label: "Sem torneio" },
              ...tournaments.map((tournament) => ({ value: String(tournament.id), label: tournament.name })),
            ]}
          />
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
          <Button type="primary" htmlType="submit" loading={isBusy} block>Criar torneio</Button>
        </form>
      </Modal>
    </div>
  );
}
