import { api } from "@/services/axios";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Input,
  Layout,
  Progress,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Statistic,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  AppstoreOutlined,
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  TrophyOutlined,
  UnorderedListOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import JoinOrganizationModal from "@/components/modals/organization/JoinOrganizationModal";
import { UniversalNavbar } from "@/components/layout/UniversalNavbar";

interface Organization {
  id: number;
  name: string;
  description?: string;
  stats?: { overall?: number };
  is_admin?: boolean;
  seasons_enabled?: boolean;
  season_duration_days?: number | null;
}

type SortOption = "name-asc" | "name-desc" | "overall-desc" | "overall-asc";
type ViewMode = "grid" | "list";

interface AuthUser {
  id: number;
  uuid?: string;
  name: string;
  is_admin?: boolean;
  is_superadmin?: boolean;
}


const FAVORITES_STORAGE_KEY = "futclebs.favorite.orgs";
const DASHBOARD_PREFS_STORAGE_KEY = "futclebs.dashboard.prefs";
const { Title, Text } = Typography;
const { Content } = Layout;

export default function DashboardHome() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinOpen, setJoinOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("overall-desc");
  const [adminsOnly, setAdminsOnly] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [favorites, setFavorites] = useState<number[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    try {
      const rawFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
      const parsedFavorites = rawFavorites ? JSON.parse(rawFavorites) : [];
      if (Array.isArray(parsedFavorites)) {
        setFavorites(parsedFavorites.filter((item) => typeof item === "number"));
      }

      const rawPrefs = localStorage.getItem(DASHBOARD_PREFS_STORAGE_KEY);
      const parsedPrefs = rawPrefs ? JSON.parse(rawPrefs) : null;
      if (parsedPrefs?.sortOption) setSortOption(parsedPrefs.sortOption);
      if (parsedPrefs?.viewMode) setViewMode(parsedPrefs.viewMode);
      if (typeof parsedPrefs?.adminsOnly === "boolean") setAdminsOnly(parsedPrefs.adminsOnly);
      if (typeof parsedPrefs?.onlyFavorites === "boolean") setOnlyFavorites(parsedPrefs.onlyFavorites);
    } catch (error) {
      console.error("Erro ao carregar preferências do dashboard:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(
      DASHBOARD_PREFS_STORAGE_KEY,
      JSON.stringify({ sortOption, viewMode, adminsOnly, onlyFavorites }),
    );
  }, [sortOption, viewMode, adminsOnly, onlyFavorites]);

  const fetchMyOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: organizationsData }, { data: meData }] = await Promise.all([
        api.get("/me/organizations"),
        api.get("/auth/me"),
      ]);

      setOrganizations(organizationsData || []);
      setCurrentUser(meData?.data ?? meData ?? null);
    } catch (err) {
      console.error(err);
      setOrganizations([]);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyOrgs();
  }, [fetchMyOrgs]);

  const toggleFavorite = (orgId: number) => {
    setFavorites((previous) =>
      previous.includes(orgId) ? previous.filter((id) => id !== orgId) : [...previous, orgId],
    );
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSortOption("overall-desc");
    setAdminsOnly(false);
    setOnlyFavorites(false);
  };

  const filteredOrganizations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = organizations.filter((org) => {
      const matchesSearch =
        !term ||
        org.name.toLowerCase().includes(term) ||
        org.description?.toLowerCase().includes(term);
      const matchesAdmin = !adminsOnly || org.is_admin;
      const matchesFavorite = !onlyFavorites || favorites.includes(org.id);
      return matchesSearch && matchesAdmin && matchesFavorite;
    });

    return [...filtered].sort((a, b) => {
      const aOverall = a.stats?.overall ?? -999;
      const bOverall = b.stats?.overall ?? -999;

      switch (sortOption) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "overall-asc":
          return aOverall - bOverall;
        case "overall-desc":
        default:
          return bOverall - aOverall;
      }
    });
  }, [organizations, searchTerm, adminsOnly, onlyFavorites, favorites, sortOption]);

  const dashboardStats = useMemo(() => {
    const total = organizations.length;
    const adminCount = organizations.filter((org) => org.is_admin).length;
    const avgOverall =
      total > 0
        ? Math.round(
            organizations.reduce((sum, org) => sum + (org.stats?.overall ?? 0), 0) / total,
          )
        : 0;
    const favoritesCount = favorites.length;

    return { total, adminCount, avgOverall, favoritesCount };
  }, [organizations, favorites]);



  const topOrganizations = useMemo(() => {
    return [...organizations]
      .sort((a, b) => (b.stats?.overall ?? -999) - (a.stats?.overall ?? -999))
      .slice(0, 5);
  }, [organizations]);


  const seasonAdoptionSummary = useMemo(() => {
    const enabledCount = organizations.filter((org) => org.seasons_enabled).length;
    const disabledCount = organizations.length - enabledCount;

    return { enabledCount, disabledCount };
  }, [organizations]);

  const strongestOrganization = useMemo(() => {
    if (!organizations.length) return null;

    return [...organizations].sort(
      (a, b) => (b.stats?.overall ?? -999) - (a.stats?.overall ?? -999),
    )[0];
  }, [organizations]);

  const renderOrganizationCard = (org: Organization) => {
    const isFavorite = favorites.includes(org.id);
    const overall = org.stats?.overall ?? 0;

    return (
      <Card
        key={org.id}
        hoverable
        onClick={() => navigate(`/dashboard/org/${org.id}`)}
        style={{ borderRadius: 20 }}
        styles={{ body: { padding: 20 } }}
        actions={[
          <Button
            key="favorite"
            type="text"
            onClick={(event) => {
              event.stopPropagation();
              toggleFavorite(org.id);
            }}
            icon={isFavorite ? <StarFilled style={{ color: "#facc15" }} /> : <StarOutlined />}
          >
            {isFavorite ? "Favorita" : "Favoritar"}
          </Button>,
        ]}
      >
        <Flex justify="space-between" align="flex-start" gap={8}>
          <Space direction="vertical" size={4}>
            <Title level={4} style={{ margin: 0 }}>{org.name}</Title>
            <Space wrap>
              {org.is_admin && <Tag color="gold">ADMIN</Tag>}
              {isFavorite && <Tag color="purple">FAVORITA</Tag>}
              {org.seasons_enabled ? (
                <Tag color="blue">TEMPORADAS {org.season_duration_days ? `(${org.season_duration_days}d)` : ""}</Tag>
              ) : (
                <Tag>SEM TEMPORADAS</Tag>
              )}
            </Space>
          </Space>
          <Badge count={`OVR ${overall}`} color="#34d399" />
        </Flex>

        <Text type="secondary">{org.description || "Sem descrição disponível."}</Text>
        <div style={{ marginTop: 14 }}>
          <Text type="secondary">Progresso competitivo</Text>
          <Progress
            percent={Math.max(0, Math.min(100, overall))}
            showInfo={false}
            strokeColor="#34d399"
            trailColor="#1f2937"
          />
        </div>
      </Card>
    );
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "transparent" }}>
      <UniversalNavbar />
      <Content style={{ maxWidth: 1200, width: "100%", margin: "0 auto", padding: "20px 14px 40px" }}>
        <Card style={{ marginBottom: 18, borderRadius: 24, border: "1px solid rgba(51,65,85,0.45)", background: "rgba(2,6,23,0.72)", backdropFilter: "blur(8px)" }}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
            <Space direction="vertical" size={4}>
              <Title level={2} style={{ margin: 0, color: "#f8fafc", fontSize: "clamp(1.25rem, 3.5vw, 1.8rem)" }}>Home Dashboard BOLANOPE</Title>
              <Text style={{ color: "#94a3b8" }}>Gerencie suas organizações com filtros inteligentes e visual moderno.</Text>
            </Space>
            <Space>
              <Button type="primary" size="large" onClick={() => setJoinOpen(true)}>
                ➕ Entrar em Organização
              </Button>
              <Button size="large" icon={<ReloadOutlined />} onClick={fetchMyOrgs}>
                Atualizar
              </Button>
            </Space>
          </Flex>
        </Card>

        {currentUser?.is_superadmin && (
          <Card
            style={{
              marginBottom: 18,
              borderRadius: 20,
              border: "1px solid rgba(250,204,21,0.35)",
              background: "linear-gradient(135deg, rgba(56,44,7,0.8), rgba(15,23,42,0.85))",
            }}
          >
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
              <Space direction="vertical" size={2}>
                <Text style={{ color: "#fcd34d", fontWeight: 700 }}>
                  <SafetyCertificateOutlined /> Painel Superadmin
                </Text>
                <Title level={4} style={{ margin: 0, color: "#fef3c7" }}>
                  Bem-vindo, {currentUser.name}
                </Title>
                <Text style={{ color: "#fde68a" }}>
                  Você possui permissões globais do sistema e pode acessar qualquer organização.
                </Text>
                <Text style={{ color: "#fef08a", fontSize: 12 }}>UUID: {currentUser.uuid ?? "não disponível"}</Text>
              </Space>
              <Space>
                <Tag color="gold">SUPERADMIN</Tag>
                <Button type="primary" onClick={() => navigate("/dashboard/superadmin")}>Abrir painel</Button>
              </Space>
            </Flex>
          </Card>
        )}

        <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
          <Col xs={24} md={12} lg={6}><Card><Statistic title="Organizações" value={dashboardStats.total} /></Card></Col>
          <Col xs={24} md={12} lg={6}><Card><Statistic title="Admin em" value={dashboardStats.adminCount} /></Card></Col>
          <Col xs={24} md={12} lg={6}><Card><Statistic title="Overall médio" value={dashboardStats.avgOverall} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col xs={24} md={12} lg={6}><Card><Statistic title="Favoritas" value={dashboardStats.favoritesCount} valueStyle={{ color: '#facc15' }} /></Card></Col>
          <Col xs={24} md={12} lg={12}><Card><Statistic title="Orgs com temporadas" value={seasonAdoptionSummary.enabledCount} valueStyle={{ color: '#60a5fa' }} /></Card></Col>
          <Col xs={24} md={12} lg={12}><Card><Statistic title="Orgs sem temporadas" value={seasonAdoptionSummary.disabledCount} /></Card></Col>
        </Row>

        {strongestOrganization && (
          <Card style={{ marginBottom: 18, borderRadius: 16 }} onClick={() => navigate(`/dashboard/org/${strongestOrganization.id}`)} hoverable>
            <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
              <Text><TrophyOutlined /> Destaque: <strong>{strongestOrganization.name}</strong></Text>
              <Tag color="green">Overall {strongestOrganization.stats?.overall ?? 0}</Tag>
            </Flex>
          </Card>
        )}

        <Card style={{ marginBottom: 18, borderRadius: 16, border: "1px solid rgba(34,197,94,0.35)", background: "linear-gradient(135deg, rgba(2,44,34,0.55), rgba(2,6,23,0.78))" }}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ marginBottom: 12 }}>
            <Text style={{ color: "#d1fae5", fontWeight: 700 }}><TrophyOutlined /> Ranking das organizações</Text>
            <Text style={{ color: "#a7f3d0" }}>Top {topOrganizations.length}</Text>
          </Flex>
          {topOrganizations.length === 0 ? (
            <Empty description="Sem organizações para ranquear" />
          ) : (
            <Space direction="vertical" style={{ width: "100%" }} size={8}>
              {topOrganizations.map((org, index) => (
                <Card
                  key={org.id}
                  size="small"
                  hoverable
                  onClick={() => navigate(`/dashboard/org/${org.id}`)}
                  style={{ borderRadius: 12, border: "1px solid rgba(16,185,129,0.25)", background: "rgba(2,6,23,0.6)" }}
                >
                  <Flex justify="space-between" align="center" wrap="wrap" gap={6}>
                    <Space>
                      <Tag color={index === 0 ? "gold" : index === 1 ? "geekblue" : "default"}>#{index + 1}</Tag>
                      <Text style={{ color: "#ecfeff", fontWeight: 600 }}>{org.name}</Text>
                    </Space>
                    <Space>
                      {org.is_admin && <Tag color="gold">ADMIN</Tag>}
                      <Tag color="green">OVR {org.stats?.overall ?? 0}</Tag>
                      {org.seasons_enabled ? <Tag color="blue">Temporadas ON</Tag> : <Tag>Temporadas OFF</Tag>}
                    </Space>
                  </Flex>
                </Card>
              ))}
            </Space>
          )}
        </Card>

        <Card style={{ marginBottom: 18, borderRadius: 16, border: "1px solid rgba(51,65,85,0.45)" }}>
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
              <Text><FilterOutlined /> Filtros</Text>
              <Text type="secondary">{filteredOrganizations.length} organização(ões)</Text>
            </Flex>

            <Row gutter={[12, 12]}>
              <Col xs={24} md={12} lg={8}>
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por nome ou descrição"
                  prefix={<SearchOutlined />}
                />
              </Col>
              <Col xs={24} md={12} lg={8}>
                <Select
                  value={sortOption}
                  onChange={(value) => setSortOption(value)}
                  style={{ width: "100%" }}
                  options={[
                    { value: "overall-desc", label: "Overall (maior → menor)" },
                    { value: "overall-asc", label: "Overall (menor → maior)" },
                    { value: "name-asc", label: "Nome (A → Z)" },
                    { value: "name-desc", label: "Nome (Z → A)" },
                  ]}
                />
              </Col>
              <Col xs={24} md={12} lg={8}>
                <Flex justify="space-between" align="center" style={{ height: "100%" }}>
                  <Space>
                    <Text>Só admin</Text>
                    <Switch checked={adminsOnly} onChange={setAdminsOnly} />
                  </Space>
                  <Space>
                    <Text>Só favoritas</Text>
                    <Switch checked={onlyFavorites} onChange={setOnlyFavorites} />
                  </Space>
                </Flex>
              </Col>
            </Row>

            <Flex justify="space-between" wrap="wrap" gap={8}>
              <Segmented
                value={viewMode}
                onChange={(value) => setViewMode(value as ViewMode)}
                options={[
                  { label: <Tooltip title="Grade"><AppstoreOutlined /></Tooltip>, value: "grid" },
                  { label: <Tooltip title="Lista"><UnorderedListOutlined /></Tooltip>, value: "list" },
                ]}
              />
              <Button onClick={resetFilters}>Limpar filtros</Button>
            </Flex>
          </Space>
        </Card>

        {loading ? (
          <Flex justify="center" style={{ padding: 60 }}><Spin size="large" /></Flex>
        ) : filteredOrganizations.length === 0 ? (
          <Card style={{ borderRadius: 16 }}>
            <Empty description="Nenhum resultado encontrado" />
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {filteredOrganizations.map((org) => (
              <Col xs={24} md={viewMode === "grid" ? 12 : 24} lg={viewMode === "grid" ? 8 : 24} key={org.id}>
                {renderOrganizationCard(org)}
              </Col>
            ))}
          </Row>
        )}

        <JoinOrganizationModal
          visible={joinOpen}
          onClose={() => setJoinOpen(false)}
          onJoined={async () => {
            await fetchMyOrgs();
          }}
        />
      </Content>
    </Layout>
  );
}
