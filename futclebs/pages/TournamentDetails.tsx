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
  Select,
  Space,
  Spin,
  Statistic,
  Steps,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { ArrowLeftOutlined, PlusOutlined, ShuffleOutlined, TeamOutlined } from "@ant-design/icons";
import { TeamPreset, loadTeamPresets } from "@/utils/teamPresets";

type TournamentType = "league" | "knockout";

type MatchStatus = "open" | "in_progress" | "finished";

interface TeamData {
  id: number;
  tournament_id: number;
  name: string;
  coach_id?: number | null;
  coach?: OrganizationPlayer | null;
  players?: OrganizationPlayer[];
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

interface KnockoutRound {
  round: number;
  matches: MatchData[];
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
  name: string;
  pivot?: { is_admin?: boolean; overall?: number };
}

interface OrganizationData {
  id: number;
  players?: OrganizationPlayer[];
}

interface AuthUser {
  id: number;
}

interface TournamentPlayerRankingRow {
  playerId: number;
  playerName: string;
  teamName: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  overall: number;
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

const actionButtonClass =
  "!h-10 !rounded-xl !border-slate-500/40 !bg-slate-900/70 !px-4 !font-semibold !text-slate-100 hover:!border-cyan-300/60 hover:!text-cyan-200";
const primaryButtonClass =
  "!h-10 !rounded-xl !border-0 !bg-gradient-to-r !from-emerald-400 !to-cyan-400 !px-4 !font-semibold !shadow-md !shadow-emerald-500/25 hover:!from-emerald-300 hover:!to-cyan-300";

const formatDateTimeLabel = (dateValue: string) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Data inválida";
  return date.toLocaleString("pt-BR");
};

const shuffleArray = <T,>(items: T[]) => {
  const cloned = [...items];
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [cloned[index], cloned[randomIndex]] = [cloned[randomIndex], cloned[index]];
  }
  return cloned;
};

const parseMatchRound = (match: MatchData) => {
  const label = match.name ?? "";
  const roundMatch = label.match(/rodada\s*(\d+)/i) ?? label.match(/round\s*(\d+)/i);
  if (roundMatch) return Number(roundMatch[1]);

  const stageMatch = label.match(/semi/i);
  if (stageMatch) return 2;
  if (label.match(/final/i)) return 3;
  return null;
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
  const [teamPlayerIds, setTeamPlayerIds] = useState<number[]>([]);
  const [teamCoachId, setTeamCoachId] = useState<number | null>(null);
  const [playersModalTeam, setPlayersModalTeam] = useState<TeamData | null>(null);
  const [teamPresets, setTeamPresets] = useState<TeamPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("none");
  const [drawMode, setDrawMode] = useState<"random" | "ranking">("random");

  const organizationPlayers = useMemo(() => organization?.players ?? [], [organization?.players]);

  const selectedPlayersByModal = useMemo(
    () => organizationPlayers.filter((player) => teamPlayerIds.includes(Number(player.id))),
    [organizationPlayers, teamPlayerIds],
  );

  const occupiedPlayersByTeam = useMemo(() => {
    const map = new Map<number, string>();
    (tournament?.teams ?? []).forEach((team) => {
      if (editingTeam?.id && team.id === editingTeam.id) return;
      (team.players ?? []).forEach((player) => {
        map.set(Number(player.id), team.name);
      });
    });
    return map;
  }, [tournament?.teams, editingTeam?.id]);

  const teamPlayersModalData = useMemo(
    () =>
      [...(playersModalTeam?.players ?? [])].sort(
        (a, b) => Number(b.pivot?.overall ?? 0) - Number(a.pivot?.overall ?? 0),
      ),
    [playersModalTeam?.players],
  );

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

  useEffect(() => {
    setTeamPresets(loadTeamPresets(orgId));
  }, [orgId]);

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



  const tournamentPlayerRanking = useMemo(() => {
    const rankingByPlayer = new Map<number, TournamentPlayerRankingRow>();

    sortedMatches
      .filter((match) => match.status === "finished" && match.team_a_id && match.team_b_id)
      .forEach((match) => {
        const teamA = teamById.get(match.team_a_id as number);
        const teamB = teamById.get(match.team_b_id as number);
        if (!teamA || !teamB) return;

        const goalsA = match.result?.goals_team_a ?? 0;
        const goalsB = match.result?.goals_team_b ?? 0;

        const registerTeamPlayers = (team: TeamData, opponentGoals: number, ownGoals: number) => {
          (team.players ?? []).forEach((player) => {
            const current = rankingByPlayer.get(player.id) ?? {
              playerId: player.id,
              playerName: player.name,
              teamName: team.name,
              matches: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              points: 0,
              overall: Number(player.pivot?.overall ?? 0),
            };

            current.matches += 1;
            current.teamName = team.name;
            current.overall = Number(player.pivot?.overall ?? current.overall ?? 0);

            if (ownGoals > opponentGoals) {
              current.wins += 1;
              current.points += 3;
            } else if (ownGoals === opponentGoals) {
              current.draws += 1;
              current.points += 1;
            } else {
              current.losses += 1;
            }

            rankingByPlayer.set(player.id, current);
          });
        };

        registerTeamPlayers(teamA, goalsB, goalsA);
        registerTeamPlayers(teamB, goalsA, goalsB);
      });

    return Array.from(rankingByPlayer.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.overall !== a.overall) return b.overall - a.overall;
      return a.playerName.localeCompare(b.playerName);
    });
  }, [sortedMatches, teamById]);

  const teamRanking = useMemo(() => {
    if ((tournament?.teams?.length ?? 0) === 0) return [];

    const baseMap = new Map<number, number>();
    (tournament?.teams ?? []).forEach((team) => {
      const averageOverall = (team.players ?? []).length
        ? (team.players ?? []).reduce((sum, player) => sum + Number(player.pivot?.overall ?? 0), 0) /
          (team.players ?? []).length
        : 0;
      baseMap.set(team.id, averageOverall);
    });

    const scoreMap = new Map<number, number>();
    (tournament?.teams ?? []).forEach((team) => {
      scoreMap.set(team.id, baseMap.get(team.id) ?? 0);
    });

    sortedMatches
      .filter((match) => match.status === "finished")
      .forEach((match) => {
        if (!match.team_a_id || !match.team_b_id) return;

        const goalsA = Number(match.result?.goals_team_a ?? 0);
        const goalsB = Number(match.result?.goals_team_b ?? 0);

        if (goalsA > goalsB) {
          scoreMap.set(match.team_a_id, (scoreMap.get(match.team_a_id) ?? 0) + 3);
        } else if (goalsB > goalsA) {
          scoreMap.set(match.team_b_id, (scoreMap.get(match.team_b_id) ?? 0) + 3);
        } else {
          scoreMap.set(match.team_a_id, (scoreMap.get(match.team_a_id) ?? 0) + 1);
          scoreMap.set(match.team_b_id, (scoreMap.get(match.team_b_id) ?? 0) + 1);
        }
      });

    return [...(tournament?.teams ?? [])].sort((teamA, teamB) => {
      const scoreA = scoreMap.get(teamA.id) ?? 0;
      const scoreB = scoreMap.get(teamB.id) ?? 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return teamA.name.localeCompare(teamB.name);
    });
  }, [sortedMatches, tournament?.teams]);

  const knockoutRounds = useMemo<KnockoutRound[]>(() => {
    const grouped = new Map<number, MatchData[]>();

    sortedMatches.forEach((match) => {
      const parsedRound = parseMatchRound(match);
      const fallbackRound = Math.max(1, Math.floor(Math.log2((tournament?.teams?.length ?? 2) / 2)) + 1);
      const round = parsedRound ?? fallbackRound;
      const current = grouped.get(round) ?? [];
      current.push(match);
      grouped.set(round, current);
    });

    return [...grouped.entries()]
      .sort(([roundA], [roundB]) => roundA - roundB)
      .map(([round, roundMatches]) => ({
        round,
        matches: roundMatches.sort(
          (matchA, matchB) => new Date(matchA.match_date).getTime() - new Date(matchB.match_date).getTime(),
        ),
      }));
  }, [sortedMatches, tournament?.teams?.length]);

  const createKnockoutBracket = async (mode: "random" | "ranking") => {
    if (!isAdmin || !tournamentId || tournament?.type !== "knockout") return;

    const teams = [...(tournament?.teams ?? [])];
    if (teams.length < 2) {
      messageApi.warning("Cadastre pelo menos dois times para gerar os confrontos.");
      return;
    }

    if (teams.length % 2 !== 0) {
      messageApi.warning("Para gerar mata-mata automático, o torneio precisa de quantidade par de times.");
      return;
    }

    if (matches.length > 0) {
      messageApi.warning("Já existem partidas cadastradas neste torneio. Remova-as para gerar uma nova chave automática.");
      return;
    }

    const baseTeams = mode === "ranking" ? teamRanking : shuffleArray(teams);
    const pairings = mode === "ranking"
      ? baseTeams.slice(0, Math.floor(baseTeams.length / 2)).map((team, index) => {
          const opponent = baseTeams[baseTeams.length - 1 - index];
          return [team, opponent] as const;
        })
      : baseTeams.reduce<Array<readonly [TeamData, TeamData]>>((accumulator, _, index, allTeams) => {
          if (index % 2 === 0 && allTeams[index + 1]) {
            accumulator.push([allTeams[index], allTeams[index + 1]]);
          }
          return accumulator;
        }, []);

    setIsBusy(true);
    try {
      await Promise.all(
        pairings.map(([teamA, teamB], index) =>
          api.post("/matches", {
            organization_id: Number(orgId),
            tournament_id: Number(tournamentId),
            team_a_id: teamA.id,
            team_b_id: teamB.id,
            name: `Rodada 1 • Jogo ${index + 1}`,
            match_date: new Date(Date.now() + index * 60 * 60 * 1000).toISOString(),
          }),
        ),
      );

      messageApi.success(
        mode === "ranking"
          ? "Chave mata-mata gerada por ranking com sucesso."
          : "Sorteio realizado com sucesso e confrontos criados automaticamente.",
      );
      await fetchData();
    } catch {
      messageApi.error("Não foi possível gerar a chave automática.");
    } finally {
      setIsBusy(false);
    }
  };

  const openTeamModal = (team?: TeamData) => {
    setEditingTeam(team ?? null);
    setTeamName(team?.name ?? "");
    setTeamPlayerIds((team?.players ?? []).map((player) => Number(player.id)).filter((id) => id > 0));
    setTeamCoachId(team?.coach_id ? Number(team.coach_id) : null);
    setSelectedPresetId("none");
    setIsTeamModalOpen(true);
  };

  const handleSaveTeam = async (event: FormEvent) => {
    event.preventDefault();
    if (!teamName.trim() || !tournamentId || !isAdmin) return;

    const normalizedPlayers = Array.from(new Set(teamPlayerIds.map((id) => Number(id)).filter((id) => id > 0)));
    const hasCoachOutsideRoster = Boolean(teamCoachId && !normalizedPlayers.includes(teamCoachId));

    const payloadPlayerIds = hasCoachOutsideRoster
      ? Array.from(new Set([...normalizedPlayers, teamCoachId as number]))
      : normalizedPlayers;

    if (hasCoachOutsideRoster) {
      messageApi.info("Técnico adicionado automaticamente ao elenco do time.");
    }

    const duplicatedPlayer = payloadPlayerIds.find((playerId) => occupiedPlayersByTeam.has(playerId));
    if (duplicatedPlayer) {
      const blockedTeam = occupiedPlayersByTeam.get(duplicatedPlayer);
      const duplicatedPlayerName =
        organizationPlayers.find((player) => Number(player.id) === duplicatedPlayer)?.name ?? "Jogador";
      messageApi.error(
        `${duplicatedPlayerName} já está no time ${blockedTeam}. Um jogador não pode participar de dois times no mesmo torneio.`,
      );
      return;
    }

    setIsBusy(true);
    try {
      if (editingTeam) {
        await api.put(`/teams/${editingTeam.id}`, {
          name: teamName.trim(),
          player_ids: payloadPlayerIds,
          coach_id: teamCoachId,
        });
        messageApi.success("Time atualizado com sucesso.");
      } else {
        await api.post("/teams", {
          tournament_id: Number(tournamentId),
          name: teamName.trim(),
          player_ids: payloadPlayerIds,
          coach_id: teamCoachId,
        });
        messageApi.success("Time cadastrado com sucesso.");
      }

      closeTeamModal();
      await fetchData();
    } catch {
      messageApi.error("Não foi possível salvar o time.");
    } finally {
      setIsBusy(false);
    }
  };

  const closeTeamModal = () => {
    setIsTeamModalOpen(false);
    setEditingTeam(null);
    setTeamName("");
    setTeamPlayerIds([]);
    setTeamCoachId(null);
    setSelectedPresetId("none");
  };

  const applyPresetToTeamForm = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId === "none") return;

    const preset = teamPresets.find((entry) => entry.id === presetId);
    if (!preset) return;

    setTeamName((current) => current || preset.name);
    setTeamPlayerIds(preset.playerIds);
    setTeamCoachId(preset.coachId);
    messageApi.success(`Base ${preset.name} carregada.`);
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
          <Button className={actionButtonClass} icon={<ArrowLeftOutlined />} onClick={() => navigate(`/dashboard/org/${orgId}`)}>
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
            <Button className={primaryButtonClass} type="primary" icon={<PlusOutlined />} onClick={() => openTeamModal()}>
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
                  <Button
                    type="link"
                    icon={<TeamOutlined />}
                    className="!font-semibold !text-violet-300"
                    onClick={() => setPlayersModalTeam(team)}
                  >
                    Jogadores
                  </Button>,
                  <Button type="link" className="!font-semibold !text-cyan-300" onClick={() => openTeamModal(team)}>Editar</Button>,
                  <Popconfirm title="Remover time?" onConfirm={() => removeTeam(team.id)}>
                    <Button type="link" danger className="!font-semibold">Remover</Button>
                  </Popconfirm>,
                ] : []}
              >
                <Text className="!text-white">{team.name}</Text>
                <Space wrap>
                  <Tag color="cyan">Jogadores: {team.players?.length ?? 0}</Tag>
                  <Tag color="gold">Técnico: {team.coach?.name ?? "Não definido"}</Tag>
                </Space>
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

        <Card title={<span className="text-white">Ranking de jogadores no torneio</span>} className="!rounded-2xl !bg-slate-900/80 !border-slate-700">
          <Text className="!text-slate-300">Ranking por desempenho coletivo no torneio (pontos por resultado das partidas em que o jogador esteve no elenco do time).</Text>
          <Table
            dataSource={tournamentPlayerRanking.slice(0, 20).map((row, index) => ({ ...row, key: row.playerId, position: index + 1 }))}
            pagination={false}
            locale={{ emptyText: "Ainda não há partidas finalizadas para gerar ranking" }}
            className="mt-3 [&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-900 [&_.ant-table-thead>tr>th]:!text-slate-200 [&_.ant-table-tbody>tr>td]:!border-slate-700 [&_.ant-table-tbody>tr>td]:!bg-slate-950/40 [&_.ant-table-tbody>tr>td]:!text-slate-100"
            columns={[
              { title: '#', dataIndex: 'position', width: 60 },
              { title: 'Jogador', dataIndex: 'playerName' },
              { title: 'Time', dataIndex: 'teamName' },
              { title: 'PTS', dataIndex: 'points', width: 70 },
              { title: 'PJ', dataIndex: 'matches', width: 70 },
              { title: 'V', dataIndex: 'wins', width: 60 },
              { title: 'E', dataIndex: 'draws', width: 60 },
              { title: 'D', dataIndex: 'losses', width: 60 },
              { title: 'OVR', dataIndex: 'overall', width: 80 },
            ]}
          />
        </Card>

        {tournament.type === "knockout" ? (
          <Card title={<span className="text-white">Chave mata-mata</span>} className="!rounded-2xl !bg-slate-900/80 !border-slate-700">
            {isAdmin && (
              <div className="mb-4 flex flex-wrap gap-2">
                <Select
                  value={drawMode}
                  onChange={(value) => setDrawMode(value as "random" | "ranking")}
                  options={[
                    { value: "random", label: "Sorteio aleatório" },
                    { value: "ranking", label: "Seed por ranking" },
                  ]}
                  style={{ minWidth: 220 }}
                />
                <Button
                  icon={<ShuffleOutlined />}
                  className={primaryButtonClass}
                  type="primary"
                  loading={isBusy}
                  onClick={() => createKnockoutBracket(drawMode)}
                >
                  Gerar chave automática
                </Button>
              </div>
            )}

            {knockoutRounds.length === 0 ? (
              <Empty description="Sem confrontos para montar chave" />
            ) : (
              <Steps
                direction="vertical"
                items={knockoutRounds.flatMap((roundEntry) => roundEntry.matches.map((match) => {
                  const teamA = match.team_a_id ? teamById.get(match.team_a_id) : null;
                  const teamB = match.team_b_id ? teamById.get(match.team_b_id) : null;
                  return {
                    title: `Rodada ${roundEntry.round}: ${teamA?.name ?? "Time A"} x ${teamB?.name ?? "Time B"}`,
                    description: match.status === "finished"
                      ? `Finalizada${typeof match.result?.goals_team_a === "number" && typeof match.result?.goals_team_b === "number" ? ` • ${match.result.goals_team_a} - ${match.result.goals_team_b}` : ""}`
                      : "Aguardando resultado",
                  };
                }))}
              />
            )}
            <Alert
              className="mt-3"
              type="info"
              showIcon
              message="A chave agora pode ser gerada automaticamente por sorteio ou por ranking (seed), sem depender da ordem de cadastro das partidas."
            />
          </Card>
        ) : (
          <Card title={<span className="text-white">Tabela (pontos corridos)</span>} className="!rounded-2xl !bg-slate-900/80 !border-slate-700">
            <Table
              dataSource={leagueTable.map((row, index) => ({ ...row, key: row.teamId, position: index + 1 }))}
              pagination={false}
              locale={{ emptyText: "Sem times para montar tabela" }}
              className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-900 [&_.ant-table-thead>tr>th]:!text-slate-200 [&_.ant-table-tbody>tr>td]:!border-slate-700 [&_.ant-table-tbody>tr>td]:!bg-slate-950/40 [&_.ant-table-tbody>tr>td]:!text-slate-100"
              columns={[
                { title: '#', dataIndex: 'position', width: 60 },
                { title: 'Time', dataIndex: 'teamName' },
                { title: 'PTS', dataIndex: 'pts', width: 70 },
                { title: 'PJ', dataIndex: 'pj', width: 70 },
                { title: 'V', dataIndex: 'v', width: 60 },
                { title: 'E', dataIndex: 'e', width: 60 },
                { title: 'D', dataIndex: 'd', width: 60 },
                { title: 'SG', dataIndex: 'sg', width: 70 },
              ]}
            />
          </Card>
        )}
      </div>

      <Modal
        open={Boolean(playersModalTeam)}
        onCancel={() => setPlayersModalTeam(null)}
        footer={null}
        width={860}
        title={<span className="text-white">Elenco completo • {playersModalTeam?.name ?? "Time"}</span>}
      >
        {teamPlayersModalData.length === 0 ? (
          <Empty description="Este time ainda não possui jogadores." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teamPlayersModalData.map((player, index) => {
              const overall = Number(player.pivot?.overall ?? 0);
              return (
                <div
                  key={`team-player-${player.id}`}
                  className="bolanope-player-card rounded-2xl border border-violet-400/40 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-4 text-white shadow-lg shadow-violet-950/30"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <Text className="!text-white !font-semibold">{player.name}</Text>
                    <Tag color="magenta" className="!font-bold">OVR {overall}</Tag>
                  </div>
                  <div className="mt-3">
                    <div className="h-2 rounded-full overflow-hidden bg-slate-700/80">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-300 transition-all duration-700"
                        style={{ width: `${Math.min(overall, 100)}%` }}
                      />
                    </div>
                  </div>
                  <Text className="!mt-2 !block !text-xs !text-slate-300">Pronto para decidir o torneio.</Text>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      <Modal
        open={isTeamModalOpen}
        onCancel={closeTeamModal}
        footer={null}
        title={editingTeam ? "Editar time" : "Cadastrar time"}
      >
        <form className="space-y-3" onSubmit={handleSaveTeam}>
          <Input
            className="!rounded-xl !border-slate-600 !bg-slate-950/70 !text-slate-100"
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            placeholder="Nome do time"
            required
          />
          <Select
            value={selectedPresetId}
            onChange={(value) => applyPresetToTeamForm(String(value))}
            options={[
              { value: "none", label: "Selecione um time pré-cadastrado da organização (opcional)" },
              ...teamPresets.map((preset) => ({
                value: preset.id,
                label: `${preset.name} • ${preset.playerIds.length} jogadores base`,
              })),
            ]}
            className="w-full"
          />
          <Select
            mode="multiple"
            className="w-full"
            placeholder="Selecione os jogadores do time"
            value={teamPlayerIds}
            onChange={(values) => setTeamPlayerIds((values as number[]).map((value) => Number(value)))}
            options={(organization?.players ?? []).map((player) => ({
              label: occupiedPlayersByTeam.has(Number(player.id))
                ? `${player.name} • ${occupiedPlayersByTeam.get(Number(player.id))}`
                : player.name,
              value: Number(player.id),
              disabled: occupiedPlayersByTeam.has(Number(player.id)),
            }))}
            optionFilterProp="label"
            showSearch
          />
          <Space wrap>
            {selectedPlayersByModal.map((player) => (
              <Tag key={player.id} color="cyan">{player.name}</Tag>
            ))}
            {selectedPlayersByModal.length === 0 && <Text className="!text-slate-400">Nenhum jogador selecionado.</Text>}
          </Space>
          <Select
            allowClear
            className="w-full"
            placeholder="Selecione o técnico"
            value={teamCoachId ?? undefined}
            onChange={(value) => setTeamCoachId(value ? Number(value) : null)}
            options={(organization?.players ?? []).map((player) => ({
              label: occupiedPlayersByTeam.has(Number(player.id))
                ? `${player.name} • ${occupiedPlayersByTeam.get(Number(player.id))}`
                : player.name,
              value: Number(player.id),
              disabled: occupiedPlayersByTeam.has(Number(player.id)),
            }))}
            optionFilterProp="label"
            showSearch
          />
          <Button className={primaryButtonClass} type="primary" htmlType="submit" loading={isBusy} block>
            Salvar
          </Button>
        </form>
      </Modal>
    </div>
  );
}
