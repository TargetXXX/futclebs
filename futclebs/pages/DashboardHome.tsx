import { api } from "@/services/axios";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Progress, Select, Spin, Switch, Tag, Tooltip } from "antd";
import { StarFilled, StarOutlined, ReloadOutlined, AppstoreOutlined, UnorderedListOutlined, SearchOutlined, TrophyOutlined, FilterOutlined, ThunderboltOutlined, RocketOutlined } from "@ant-design/icons";
import JoinOrganizationModal from "@/components/modals/organization/JoinOrganizationModal";
import { UniversalNavbar } from "@/components/layout/UniversalNavbar";

interface Organization {
  id: number;
  name: string;
  description?: string;
  stats?: { overall?: number };
  is_admin?: boolean;
}

type SortOption = "name-asc" | "name-desc" | "overall-desc" | "overall-asc";
type ViewMode = "grid" | "list";

const FAVORITES_STORAGE_KEY = "futclebs.favorite.orgs";
const DASHBOARD_PREFS_STORAGE_KEY = "futclebs.dashboard.prefs";
const RECENT_ORGS_STORAGE_KEY = "futclebs.recent.orgs";

export default function DashboardHome() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinOpen, setJoinOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("overall-desc");
  const [adminsOnly, setAdminsOnly] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [claimedMissionIds, setClaimedMissionIds] = useState<number[]>([]);
  const [recentOrganizations, setRecentOrganizations] = useState<number[]>([]);

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
      if (Array.isArray(parsedPrefs?.claimedMissionIds)) setClaimedMissionIds(parsedPrefs.claimedMissionIds);

      const rawRecentOrgs = localStorage.getItem(RECENT_ORGS_STORAGE_KEY);
      const parsedRecent = rawRecentOrgs ? JSON.parse(rawRecentOrgs) : [];
      if (Array.isArray(parsedRecent)) {
        setRecentOrganizations(parsedRecent.filter((item) => typeof item === "number"));
      }
    } catch (error) {
      console.error("Erro ao carregar preferências do dashboard:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(RECENT_ORGS_STORAGE_KEY, JSON.stringify(recentOrganizations));
  }, [recentOrganizations]);

  useEffect(() => {
    localStorage.setItem(
      DASHBOARD_PREFS_STORAGE_KEY,
      JSON.stringify({ sortOption, viewMode, adminsOnly, onlyFavorites, claimedMissionIds }),
    );
  }, [sortOption, viewMode, adminsOnly, onlyFavorites, claimedMissionIds]);

  const fetchMyOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/me/organizations");
      setOrganizations(data || []);
    } catch (err) {
      console.error(err);
      setOrganizations([]);
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

  const openOrganization = (orgId: number) => {
    setRecentOrganizations((current) => [orgId, ...current.filter((id) => id !== orgId)].slice(0, 5));
    navigate(`/dashboard/org/${orgId}`);
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

  const strongestOrganization = useMemo(() => {
    if (!organizations.length) return null;

    return [...organizations].sort(
      (a, b) => (b.stats?.overall ?? -999) - (a.stats?.overall ?? -999),
    )[0];
  }, [organizations]);

  const recentOrganizationNames = useMemo(
    () => recentOrganizations
      .map((id) => organizations.find((org) => org.id === id)?.name)
      .filter(Boolean)
      .slice(0, 3) as string[],
    [organizations, recentOrganizations],
  );

  const openRandomOrganization = () => {
    if (!filteredOrganizations.length) return;
    const randomOrg = filteredOrganizations[Math.floor(Math.random() * filteredOrganizations.length)];
    openOrganization(randomOrg.id);
  };

  const progressMissions = useMemo(
    () => [
      {
        id: 1,
        title: "Scout em Ação",
        subtitle: "Tenha ao menos 3 organizações favoritas",
        progress: Math.min(100, Math.round((favorites.length / 3) * 100)),
      },
      {
        id: 2,
        title: "Gestor Pro",
        subtitle: "Seja admin em 2 organizações",
        progress: Math.min(100, Math.round((dashboardStats.adminCount / 2) * 100)),
      },
      {
        id: 3,
        title: "Elite",
        subtitle: "Mantenha média geral acima de 80 OVR",
        progress: Math.min(100, Math.round((dashboardStats.avgOverall / 80) * 100)),
      },
    ],
    [favorites.length, dashboardStats.adminCount, dashboardStats.avgOverall],
  );

  const renderOrganizationCard = (org: Organization) => {
    const isFavorite = favorites.includes(org.id);
    const overall = org.stats?.overall ?? 0;

    if (viewMode === "list") {
      return (
        <div
          key={org.id}
          onClick={() => openOrganization(org.id)}
          className="cursor-pointer bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/40 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{org.name}</h3>
              {org.is_admin && <Tag color="gold">ADMIN</Tag>}
              {isFavorite && <Tag color="purple">FAVORITA</Tag>}
              {recentOrganizations.includes(org.id) && <Tag color="blue">RECENTE</Tag>}
            </div>
            <p className="text-slate-400 text-sm max-w-2xl">{org.description || "Sem descrição disponível."}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right min-w-24">
              <div className="text-xs text-slate-400">Overall</div>
              <div className="text-emerald-400 font-semibold text-xl">{overall}</div>
            </div>
            <Button
              type="text"
              className="!text-yellow-400"
              onClick={(event) => {
                event.stopPropagation();
                toggleFavorite(org.id);
              }}
              icon={isFavorite ? <StarFilled /> : <StarOutlined />}
            />
          </div>
        </div>
      );
    }

    return (
      <div
        key={org.id}
        onClick={() => openOrganization(org.id)}
        className="cursor-pointer bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 group"
      >
        <div className="flex justify-between items-start mb-4 gap-2">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold group-hover:text-emerald-400 transition">{org.name}</h3>
            <div className="flex gap-2 flex-wrap">
              {org.is_admin && <Tag color="gold">ADMIN</Tag>}
              {favorites.includes(org.id) && <Tag color="purple">FAVORITA</Tag>}
              {recentOrganizations.includes(org.id) && <Tag color="blue">RECENTE</Tag>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {org.stats?.overall !== undefined && (
              <div className="px-3 py-1 text-sm rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                {org.stats.overall}
              </div>
            )}
            <Button
              type="text"
              className="!text-yellow-400"
              onClick={(event) => {
                event.stopPropagation();
                toggleFavorite(org.id);
              }}
              icon={favorites.includes(org.id) ? <StarFilled /> : <StarOutlined />}
            />
          </div>
        </div>

        <p className="text-slate-400 text-sm leading-relaxed">{org.description || "Sem descrição disponível."}</p>

        <div className="mt-5">
          <div className="text-xs text-slate-400 mb-1">Progresso competitivo</div>
          <Progress
            percent={Math.max(0, Math.min(100, overall))}
            showInfo={false}
            strokeColor="#34d399"
            trailColor="#1f2937"
          />
        </div>

        <div className="mt-5 text-sm text-emerald-400 opacity-0 group-hover:opacity-100 transition">Entrar →</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <UniversalNavbar />

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Seu Dashboard Profissional</h1>
            <p className="text-slate-400 mt-2">Visual premium, filtros avançados e ações rápidas para gestão de organizações.</p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => setJoinOpen(true)} className="rounded-2xl bg-emerald-500 text-white" type="primary">
              ➕ Entrar em Organização
            </Button>
            <Button onClick={fetchMyOrgs} className="rounded-2xl" icon={<ReloadOutlined />}>
              Atualizar
            </Button>
            <Button onClick={openRandomOrganization} className="rounded-2xl" disabled={!filteredOrganizations.length}>
              🎲 Surpreenda-me
            </Button>
          </div>
        </div>

        {recentOrganizationNames.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-2 flex-wrap">
            <span className="text-slate-300 text-sm">Últimas visitadas:</span>
            {recentOrganizationNames.map((name) => (
              <Tag key={name} color="blue">{name}</Tag>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="text-slate-400 text-sm">Organizações</div>
            <div className="text-2xl font-bold mt-1">{dashboardStats.total}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="text-slate-400 text-sm">Admin em</div>
            <div className="text-2xl font-bold mt-1">{dashboardStats.adminCount}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="text-slate-400 text-sm">Overall médio</div>
            <div className="text-2xl font-bold mt-1 text-emerald-400">{dashboardStats.avgOverall}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="text-slate-400 text-sm">Favoritas</div>
            <div className="text-2xl font-bold mt-1 text-yellow-400">{dashboardStats.favoritesCount}</div>
          </div>
        </div>

        {strongestOrganization && (
          <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-400/20 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-emerald-300 text-sm flex items-center gap-2"><TrophyOutlined /> Destaque do seu elenco</div>
              <div className="text-lg font-semibold">{strongestOrganization.name}</div>
            </div>
            <Tag color="green">Overall {strongestOrganization.stats?.overall ?? 0}</Tag>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4">
          {progressMissions.map((mission) => {
            const isDone = mission.progress >= 100;
            const isClaimed = claimedMissionIds.includes(mission.id);

            return (
              <div
                key={mission.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-100">{mission.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{mission.subtitle}</p>
                  </div>
                  {isDone ? <RocketOutlined className="text-cyan-300" /> : <ThunderboltOutlined className="text-amber-300" />}
                </div>

                <Progress
                  className="mt-3"
                  percent={mission.progress}
                  strokeColor={isDone ? "#22d3ee" : "#34d399"}
                  trailColor="#1f2937"
                />

                <Button
                  className="mt-2"
                  block
                  type={isDone && !isClaimed ? "primary" : "default"}
                  disabled={!isDone || isClaimed}
                  onClick={() => setClaimedMissionIds((current) => [...current, mission.id])}
                >
                  {isClaimed ? "Recompensa resgatada" : isDone ? "Resgatar recompensa" : "Complete a missão"}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2 text-slate-300"><FilterOutlined /> Filtros inteligentes</div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nome ou descrição"
              prefix={<SearchOutlined />}
              className="rounded-xl"
            />

            <Select
              value={sortOption}
              onChange={(value) => setSortOption(value)}
              className="w-full"
              options={[
                { value: "overall-desc", label: "Overall (maior → menor)" },
                { value: "overall-asc", label: "Overall (menor → maior)" },
                { value: "name-asc", label: "Nome (A → Z)" },
                { value: "name-desc", label: "Nome (Z → A)" },
              ]}
            />

            <div className="flex items-center justify-between px-3 rounded-xl border border-slate-700 bg-slate-950/50">
              <span className="text-sm text-slate-300">Só admin</span>
              <Switch checked={adminsOnly} onChange={setAdminsOnly} />
            </div>

            <div className="flex items-center justify-between px-3 rounded-xl border border-slate-700 bg-slate-950/50">
              <span className="text-sm text-slate-300">Só favoritas</span>
              <Switch checked={onlyFavorites} onChange={setOnlyFavorites} />
            </div>

            <div className="flex items-center gap-2">
              <Tooltip title="Visualização em grade">
                <Button
                  onClick={() => setViewMode("grid")}
                  type={viewMode === "grid" ? "primary" : "default"}
                  icon={<AppstoreOutlined />}
                />
              </Tooltip>
              <Tooltip title="Visualização em lista">
                <Button
                  onClick={() => setViewMode("list")}
                  type={viewMode === "list" ? "primary" : "default"}
                  icon={<UnorderedListOutlined />}
                />
              </Tooltip>
              <Button onClick={resetFilters}>Limpar</Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <Spin />
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/60 border border-slate-800 rounded-3xl">
            <h2 className="text-xl font-semibold mb-3">Nenhum resultado encontrado</h2>
            <p className="text-slate-400 mb-6">Ajuste os filtros ou entre em uma nova organização.</p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={resetFilters}>Limpar filtros</Button>
              <Button onClick={() => setJoinOpen(true)} className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 transition font-semibold shadow-lg shadow-emerald-500/20" type="primary">
                Buscar Organizações
              </Button>
            </div>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredOrganizations.map(renderOrganizationCard)}
          </div>
        )}

        <JoinOrganizationModal
          visible={joinOpen}
          onClose={() => setJoinOpen(false)}
          onJoined={async () => {
            await fetchMyOrgs();
          }}
        />
      </div>
    </div>
  );
}
