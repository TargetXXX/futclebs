import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/services/axios";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  List,
  Modal,
  Popconfirm,
  Row,
  Space,
  Spin,
  Statistic,
  Steps,
  Tag,
  Typography,
  message,
} from "antd";
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";

type TournamentType = "league" | "knockout";

type MatchStatus = "open" | "in_progress" | "finished";

interface TeamData {
  id: number;
  tournament_id: number;
  name: string;
}

interface MatchResult {
  goals_team_a?: number;
  goals_team_b?: number;
}

interface MatchData {
  id: number;
  name?: string;
  match_date: string;
  status: MatchStatus;
  tournament_id?: number | null;
  team_a_id?: number | null;
  team_b_id?: number | null;
  result?: MatchResult | null;
}

interface TournamentData {
  id: number;
  name: string;
  type?: TournamentType;
  start_date?: string | null;
  end_date?: string | null;
  teams?: TeamData[];
}

interface OrganizationPlayer {
  id: number;
  pivot?: { is_admin?: boolean };
}

interface OrganizationData {
  id: number;
  players?: OrganizationPlayer[];
}

interface AuthUser {
  id: number;
}

interface StandingRow {
  teamId: number;
  teamName: string;
  pts: number;
  pj: number;
  v: number;
  e: number;
  d: number;
  gp: number;
  gc: number;
  sg: number;
}

const { Title, Text } = Typography;

const formatDateTimeLabel = (dateValue: string) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Data inválida";
  return date.toLocaleString("pt-BR");
};

export default function TournamentDetails() {
  const { orgId, tournamentId } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamData | null>(null);
  const [teamName, setTeamName] = useState("");

  const fetchData = async () => {
    if (!orgId || !tournamentId) return;

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

      const selectedTournament = (tournamentsPayload as TournamentData[]).find(
        (entry) => entry.id === Number(tournamentId),
      );

      setOrganization(orgPayload);
      setUser(mePayload);
      setTournament(selectedTournament ?? null);
      setMatches(
        (matchesPayload as MatchData[]).filter((match) => match.tournament_id === Number(tournamentId)),
      );
    } catch {
      messageApi.error("Não foi possível carregar os dados do torneio.");
      setTournament(null);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) localStorage.setItem("orgId", orgId);
    fetchData();
  }, [orgId, tournamentId]);

  const isAdmin = useMemo(() => {
    if (!organization?.players || !user) return false;
    return Boolean(organization.players.find((player) => player.id === user.id)?.pivot?.is_admin);
  }, [organization?.players, user]);

  const teamById = useMemo(
    () => new Map((tournament?.teams ?? []).map((team) => [team.id, team])),
    [tournament?.teams],
  );

  const sortedMatches = useMemo(
    () => [...matches].sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()),
    [matches],
  );

  const leagueTable = useMemo(() => {
    const initial = new Map<number, StandingRow>();
    (tournament?.teams ?? []).forEach((team) => {
      initial.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        pts: 0,
        pj: 0,
        v: 0,
        e: 0,
        d: 0,
        gp: 0,
        gc: 0,
        sg: 0,
      });
    });

    sortedMatches
      .filter((match) => match.status === "finished" && match.team_a_id && match.team_b_id)
      .forEach((match) => {
        const rowA = initial.get(match.team_a_id as number);
        const rowB = initial.get(match.team_b_id as number);
        if (!rowA || !rowB) return;

        const goalsA = match.result?.goals_team_a ?? 0;
        const goalsB = match.result?.goals_team_b ?? 0;

        rowA.pj += 1;
        rowB.pj += 1;
        rowA.gp += goalsA;
        rowA.gc += goalsB;
        rowB.gp += goalsB;
        rowB.gc += goalsA;

        if (goalsA > goalsB) {
          rowA.v += 1;
          rowA.pts += 3;
          rowB.d += 1;
        } else if (goalsB > goalsA) {
          rowB.v += 1;
          rowB.pts += 3;
          rowA.d += 1;
        } else {
          rowA.e += 1;
          rowB.e += 1;
          rowA.pts += 1;
          rowB.pts += 1;
        }

        rowA.sg = rowA.gp - rowA.gc;
        rowB.sg = rowB.gp - rowB.gc;
      });

    return Array.from(initial.values()).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.sg !== a.sg) return b.sg - a.sg;
      return b.gp - a.gp;
    });
  }, [sortedMatches, tournament?.teams]);

  const knockoutRounds = useMemo(() => {
    const finished = sortedMatches.filter((match) => match.status === "finished");
    const open = sortedMatches.filter((match) => match.status !== "finished");
    const entries = finished.length > 0 ? finished : open;

    return entries.map((match, index) => {
      const round = Math.floor(index / 2) + 1;
      return { ...match, round };
    });
  }, [sortedMatches]);

  const openTeamModal = (team?: TeamData) => {
    setEditingTeam(team ?? null);
    setTeamName(team?.name ?? "");
    setIsTeamModalOpen(true);
  };

  const handleSaveTeam = async (event: FormEvent) => {
    event.preventDefault();
    if (!teamName.trim() || !tournamentId || !isAdmin) return;

    setIsBusy(true);
    try {
      if (editingTeam) {
        await api.put(`/teams/${editingTeam.id}`, { name: teamName.trim() });
        messageApi.success("Time atualizado com sucesso.");
      } else {
        await api.post("/teams", { tournament_id: Number(tournamentId), name: teamName.trim() });
        messageApi.success("Time cadastrado com sucesso.");
      }

      setIsTeamModalOpen(false);
      setEditingTeam(null);
      setTeamName("");
      await fetchData();
    } catch {
      messageApi.error("Não foi possível salvar o time.");
    } finally {
      setIsBusy(false);
    }
  };

  const removeTeam = async (teamId: number) => {
    if (!isAdmin) return;

    setIsBusy(true);
    try {
      await api.delete(`/teams/${teamId}`);
      messageApi.success("Time removido com sucesso.");
      await fetchData();
    } catch {
      messageApi.error("Não foi possível remover o time.");
    } finally {
      setIsBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Torneio não encontrado.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-[#071a3d] text-white">
      {contextHolder}
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/dashboard/org/${orgId}`)}>
            Voltar
          </Button>
          <Tag color="blue">{tournament.type === "knockout" ? "Mata-mata" : "Liga"}</Tag>
        </Space>

        <Card className="!bg-slate-900/80 !border-slate-700 !rounded-2xl !shadow-xl !shadow-black/20">
          <Title level={3} className="!text-white !mb-1">{tournament.name}</Title>
          <Text className="!text-slate-300">
            Página do torneio com gerenciamento de times, histórico de partidas e visualização {tournament.type === "knockout" ? "da chave" : "da tabela"}.
          </Text>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}><Card className="!rounded-2xl"><Statistic title="Times" value={tournament.teams?.length ?? 0} /></Card></Col>
          <Col xs={24} md={8}><Card className="!rounded-2xl"><Statistic title="Partidas" value={matches.length} /></Card></Col>
          <Col xs={24} md={8}><Card className="!rounded-2xl"><Statistic title="Finalizadas" value={matches.filter((m) => m.status === "finished").length} /></Card></Col>
        </Row>

        <Card
          title={<span className="text-white">Times cadastrados</span>}
          className="!rounded-2xl !bg-slate-900/80 !border-slate-700"
          extra={isAdmin ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openTeamModal()}>
              Cadastrar time
            </Button>
          ) : undefined}
        >
          <List
            dataSource={tournament.teams ?? []}
            locale={{ emptyText: "Nenhum time cadastrado" }}
            renderItem={(team) => (
              <List.Item
                actions={isAdmin ? [
                  <Button type="link" onClick={() => openTeamModal(team)}>Editar</Button>,
                  <Popconfirm title="Remover time?" onConfirm={() => removeTeam(team.id)}>
                    <Button type="link" danger>Remover</Button>
                  </Popconfirm>,
                ] : []}
              >
                <Text className="!text-white">{team.name}</Text>
              </List.Item>
            )}
          />
        </Card>

        <Card title={<span className="text-white">Histórico de partidas</span>} className="!rounded-2xl !bg-slate-900/80 !border-slate-700">
          <List
            dataSource={sortedMatches}
            locale={{ emptyText: "Sem partidas cadastradas para este torneio" }}
            renderItem={(match) => {
              const teamA = match.team_a_id ? teamById.get(match.team_a_id) : null;
              const teamB = match.team_b_id ? teamById.get(match.team_b_id) : null;
              const goalsA = match.result?.goals_team_a;
              const goalsB = match.result?.goals_team_b;

              return (
                <List.Item>
                  <Space direction="vertical" size={0}>
                    <Text className="!text-white">{teamA?.name ?? "Time A"} x {teamB?.name ?? "Time B"}</Text>
                    <Text className="!text-slate-300">{formatDateTimeLabel(match.match_date)}</Text>
                    <Space>
                      <Tag color={match.status === "finished" ? "green" : "blue"}>{match.status}</Tag>
                      {typeof goalsA === "number" && typeof goalsB === "number" && (
                        <Tag color="purple">Placar: {goalsA} - {goalsB}</Tag>
                      )}
                    </Space>
                  </Space>
                </List.Item>
              );
            }}
          />
        </Card>

        {tournament.type === "knockout" ? (
          <Card title={<span className="text-white">Chave mata-mata</span>} className="!rounded-2xl !bg-slate-900/80 !border-slate-700">
            {knockoutRounds.length === 0 ? (
              <Empty description="Sem confrontos para montar chave" />
            ) : (
              <Steps
                direction="vertical"
                items={knockoutRounds.map((match) => {
                  const teamA = match.team_a_id ? teamById.get(match.team_a_id) : null;
                  const teamB = match.team_b_id ? teamById.get(match.team_b_id) : null;
                  return {
                    title: `Rodada ${match.round}: ${teamA?.name ?? "Time A"} x ${teamB?.name ?? "Time B"}`,
                    description: match.status === "finished"
                      ? `Finalizada${typeof match.result?.goals_team_a === "number" && typeof match.result?.goals_team_b === "number" ? ` • ${match.result.goals_team_a} - ${match.result.goals_team_b}` : ""}`
                      : "Aguardando resultado",
                  };
                })}
              />
            )}
            <Alert
              className="mt-3"
              type="info"
              showIcon
              message="A chave é exibida pela ordem cronológica das partidas cadastradas."
            />
          </Card>
        ) : (
          <Card title={<span className="text-white">Tabela (pontos corridos)</span>} className="!rounded-2xl !bg-slate-900/80 !border-slate-700">
            <List
              dataSource={leagueTable}
              locale={{ emptyText: "Sem times para montar tabela" }}
              renderItem={(row, index) => (
                <List.Item>
                  <Space>
                    <Tag color="gold">#{index + 1}</Tag>
                    <Text className="!text-white min-w-[150px]">{row.teamName}</Text>
                    <Tag>PTS {row.pts}</Tag>
                    <Tag>PJ {row.pj}</Tag>
                    <Tag>V {row.v}</Tag>
                    <Tag>E {row.e}</Tag>
                    <Tag>D {row.d}</Tag>
                    <Tag>SG {row.sg}</Tag>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        )}
      </div>

      <Modal
        open={isTeamModalOpen}
        onCancel={() => setIsTeamModalOpen(false)}
        footer={null}
        title={editingTeam ? "Editar time" : "Cadastrar time"}
      >
        <form className="space-y-3" onSubmit={handleSaveTeam}>
          <Input
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            placeholder="Nome do time"
            required
          />
          <Button type="primary" htmlType="submit" loading={isBusy} block>
            Salvar
          </Button>
        </form>
      </Modal>
    </div>
  );
}
