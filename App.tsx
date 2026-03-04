import React, { useCallback, useEffect, useState } from 'react';
import { SUPER_ADMIN_IDS } from './constants/app.constants';
import { Step } from './types/app.types';
import { formatPhone } from './utils/phone.utils';

// Hooks
import { useAuth } from './hooks/useAuth.hook';
import { useUserProfile } from './hooks/useUserProfile.hook';
import { useMatches } from './hooks/useMatches.hook';
import { useModals } from './hooks/useModals.hook';
import { useAvatar } from './hooks/useAvatar.hook';
import { useUIState } from './hooks/useUIState.hook';
import { useFormState } from './hooks/useFormState.hook';
import { useAuthHandlers } from './hooks/useAuthHandlers.hook';
import { useMatchFilters } from './hooks/useMatchFilters.hook';
import { useDashboardHandlers } from './hooks/useDashboardHandlers.hook';
import { usePlayerDebt } from './hooks/usePlayerDebt.hook';
import { useOrganizations } from './hooks/useOrganizations.hook';

// Components
import { AuthForm } from './components/auth/AuthForm.component';
import { DashboardHeader } from './components/dashboard/DashboardHeader.component';
import { StatsCard } from './components/dashboard/StatsCard.component';
import { TabsNavigation } from './components/dashboard/TabsNavigation.component';
import { MatchCard } from './components/dashboard/MatchCard.component';
import { RankingTab } from './components/dashboard/RankingTab';
import { OrganizationSelector } from './components/dashboard/OrganizationSelector.component';
import { OrganizationAccessPanel } from './components/dashboard/OrganizationAccessPanel.component';
import { AllModals } from './components/AllModals.component';

const ORGANIZATION_ROUTE_PREFIX = '/organization/';

const getOrganizationIdFromPath = (pathname: string): string | null => {
  if (!pathname.startsWith(ORGANIZATION_ROUTE_PREFIX)) return null;

  const organizationId = pathname.slice(ORGANIZATION_ROUTE_PREFIX.length).split('/')[0]?.trim();
  return organizationId || null;
};

const App: React.FC = () => {
  // Core hooks
  const { session, initializing, signOut } = useAuth();
  const { userProfile, userStats, fetchUserProfile, updateUserProfile, setUserProfile } = useUserProfile();
  const { matches, fetchMatches, deleteMatch } = useMatches();
  const modals = useModals();
  const avatar = useAvatar(session?.user?.id || '', () => fetchUserProfile(session?.user?.id || ''));

  const {
    organizations,
    selectedOrganizationId,
    loadingOrganizations,
    isCurrentOrganizationAdmin,
    selectOrganization,
    searchOrganizations,
    joinOrganization,
    createOrganization
  } = useOrganizations(session?.user?.id || null);

  // UI State
  const ui = useUIState();
  const form = useFormState();

  // Loading profile state
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingOrganizationData, setLoadingOrganizationData] = useState(false);
  const [routeOrganizationId, setRouteOrganizationId] = useState<string | null>(() =>
    getOrganizationIdFromPath(window.location.pathname)
  );

  // Computed
  const isSuperAdmin = !!userProfile && SUPER_ADMIN_IDS.includes(userProfile.id);
  const isOrganizationAdmin = isCurrentOrganizationAdmin || isSuperAdmin;
  const { getFilteredMatches, getCategoryCount } = useMatchFilters(matches);
  const filteredMatches = getFilteredMatches(ui.activeCategory);

  const hasOrganizations = organizations.length > 0;
  const organizationFromRoute = organizations.find((org) => org.id === routeOrganizationId) || null;
  const activeOrganizationId = organizationFromRoute?.id || null;
  const isOrganizationDashboard = !!activeOrganizationId;
  const hasInvalidOrganizationRoute = !!routeOrganizationId && !organizationFromRoute;

  // Débito do jogador logado
  const { debt } = usePlayerDebt(userProfile?.id ?? null, activeOrganizationId);


  // Load user data
  const loadUserData = useCallback(async (userId: string) => {
    setLoadingProfile(true);
    try {
      await fetchUserProfile(userId);
    } finally {
      setLoadingProfile(false);
    }
  }, [fetchUserProfile]);


  useEffect(() => {
    const handlePopState = () => {
      setRouteOrganizationId(getOrganizationIdFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigateToOrganization = useCallback((organizationId: string | null) => {
    const nextPath = organizationId ? `${ORGANIZATION_ROUTE_PREFIX}${organizationId}` : '/';

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }

    setRouteOrganizationId(organizationId);
  }, []);

  const handleSelectOrganization = useCallback((organizationId: string) => {
    selectOrganization(organizationId);
    navigateToOrganization(organizationId);
  }, [navigateToOrganization, selectOrganization]);

  const handleBackToInitialDashboard = useCallback(() => {
    navigateToOrganization(null);
  }, [navigateToOrganization]);

  useEffect(() => {
    if (!routeOrganizationId || !hasOrganizations) return;

    if (selectedOrganizationId !== routeOrganizationId) {
      selectOrganization(routeOrganizationId);
    }
  }, [hasOrganizations, routeOrganizationId, selectOrganization, selectedOrganizationId]);

  useEffect(() => {
    const loadOrganizationDashboard = async () => {
      if (!session?.user?.id || !activeOrganizationId) return;
      setLoadingOrganizationData(true);
      try {
        await fetchMatches(session.user.id, activeOrganizationId);
      } finally {
        setLoadingOrganizationData(false);
      }
    };

    loadOrganizationDashboard();
  }, [activeOrganizationId, fetchMatches, session?.user?.id]);

  // Auth handlers
  const authHandlers = useAuthHandlers(loadUserData, ui.setStep, ui.setError, ui.setLoading);

  // Dashboard handlers
  const dashboardHandlers = useDashboardHandlers(
    userProfile,
    isSuperAdmin,
    activeOrganizationId,
    deleteMatch,
    fetchMatches,
    fetchUserProfile,
    modals,
    avatar,
    updateUserProfile,
    ui.setError,
    ui.setLoading,
    ui.setActiveAdminMenu
  );

  // Logout handler
  const handleLogout = useCallback(async () => {
    try {
      ui.setLoading(true);
      await signOut();
    } catch (err) {
      console.error('Erro ao sair:', err);
    } finally {
      ui.setLoading(false);
    }
  }, [signOut, ui]);

  // Load user on session change — só dispara se o userId realmente mudou
  useEffect(() => {
    if (session?.user) {
      if (!userProfile || userProfile.id !== session.user.id) {
        loadUserData(session.user.id);
      }
    } else {
      setUserProfile(null);
      ui.setStep(Step.PHONE_CHECK);
    }
  }, [session, loadUserData, setUserProfile, ui.setStep]);

  // Loading inicial
  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest animate-pulse">Iniciando...</p>
      </div>
    );
  }

  // Loading profile (evita flicker da tela de login ao recarregar)
  if (session && loadingProfile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest animate-pulse">Carregando perfil...</p>
      </div>
    );
  }

  if (session && loadingOrganizations) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest animate-pulse">Carregando organizações...</p>
      </div>
    );
  }

  // Tela de autenticação
  if (!session || !userProfile) {
    return (
      <AuthForm
        step={ui.step}
        loading={ui.loading}
        error={ui.error}
        phone={form.phone}
        password={form.password}
        name={form.name}
        isGoalkeeper={form.isGoalkeeper}
        onPhoneChange={(e) => form.setPhone(formatPhone(e.target.value))}
        onPasswordChange={(e) => form.setPassword(e.target.value)}
        onNameChange={(e) => form.setName(e.target.value)}
        onGoalkeeperToggle={() => form.setIsGoalkeeper(!form.isGoalkeeper)}
        onCheckPhone={(e) => {
          e.preventDefault();
          authHandlers.handleCheckPhone(form.phone);
        }}
        onLogin={(e) => {
          e.preventDefault();
          authHandlers.handleLogin(form.phone, form.password);
        }}
        onRegister={(e) => {
          e.preventDefault();
          authHandlers.handleRegister(form.phone, form.password, form.name, form.isGoalkeeper);
        }}
      />
    );
  }

  // Dashboard principal
  return (
    <div className="min-h-screen bg-slate-950 pb-20 p-3 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
        {/* Header */}
        <DashboardHeader
          userProfile={userProfile}
          isSuperAdmin={isSuperAdmin}
          isOrganizationAdmin={isOrganizationAdmin}
          organizationName={organizationFromRoute?.name || null}
          onOpenUserManagement={() => modals.openModal('isAdminUserManagementOpen')}
          onOpenCreateMatch={() => modals.openModal('isCreateMatchOpen')}
          onOpenSeasonModal={() => modals.openModal('isSeasonModalOpen')}
          onOpenWhatsAppConfig={() => modals.openModal('isWhatsAppConfigOpen')}
          onOpenFinancial={() => modals.openModal('isFinancialModalOpen')}
          onLogout={handleLogout}
        />

        <OrganizationSelector
          organizations={organizations}
          selectedOrganizationId={activeOrganizationId || selectedOrganizationId}
          onSelectOrganization={handleSelectOrganization}
          isLoading={loadingOrganizationData}
        />


        <OrganizationAccessPanel
          isSuperAdmin={isSuperAdmin}
          onSearchOrganizations={searchOrganizations}
          onJoinOrganization={joinOrganization}
          onCreateOrganization={createOrganization}
        />

        {!hasOrganizations ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 text-center">
            <p className="text-sm font-black text-white">Você ainda não está vinculado a nenhuma organização.</p>
            <p className="text-slate-400 text-xs mt-2">Pesquise por nome e entre com a senha da organização para começar.</p>
            <button
              onClick={handleLogout}
              className="mt-5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-black uppercase text-slate-200"
            >
              Sair
            </button>
          </div>
        ) : !isOrganizationDashboard ? (
          <section className="space-y-4">
            {hasInvalidOrganizationRoute && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <p className="text-amber-300 text-xs font-black uppercase tracking-wide">Organização não encontrada</p>
                  <p className="text-amber-100/90 text-xs mt-1">A URL acessada não pertence às suas organizações. Escolha uma organização abaixo para continuar.</p>
                </div>
                <button
                  onClick={handleBackToInitialDashboard}
                  className="px-3 py-2 rounded-xl border border-amber-400/40 text-amber-200 text-[11px] font-black uppercase hover:bg-amber-400/10"
                >
                  Voltar para início
                </button>
              </div>
            )}

            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Dashboard inicial</p>
                  <h3 className="text-white text-sm sm:text-base font-black">Selecione a organização para visualizar os dados</h3>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full border border-emerald-500/30 text-emerald-300 bg-emerald-500/10">
                  {organizations.length} organização{organizations.length > 1 ? 'ões' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {organizations.map((org) => {
                  const isDefault = selectedOrganizationId === org.id;
                  return (
                    <article
                      key={org.id}
                      className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 flex flex-col gap-3"
                    >
                      <div>
                        <p className="text-white text-sm font-black leading-tight">{org.name}</p>
                        <p className="text-slate-400 text-xs mt-1 line-clamp-2">{org.description?.trim() || 'Sem descrição cadastrada para esta organização.'}</p>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleSelectOrganization(org.id)}
                          className="px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-[11px] font-black uppercase hover:bg-emerald-500/30"
                        >
                          Abrir dashboard
                        </button>
                        {isDefault && (
                          <span className="text-[10px] text-slate-300 font-black uppercase tracking-wide">Padrão</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        ) : (
          <>
        {/* Stats Card */}
        <StatsCard
          userProfile={userProfile}
          userStats={userStats}
          onOpenStats={() => modals.openModal('isStatsModalOpen')}
          onOpenAvatar={() => modals.openModal('isAvatarModalOpen')}
          onOpenPositions={() => modals.openModal('isPositionSelectorOpen')}
        />

        {/* Banner de cobrança pendente */}
        {debt && (
          <div className={`flex items-center gap-3 p-4 rounded-2xl border ${debt.isOverdue ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
            <span className="text-2xl shrink-0">{debt.isOverdue ? '🚨' : '💰'}</span>
            <div className="flex-1 min-w-0">
              <p className={`font-black text-sm ${debt.isOverdue ? 'text-red-400' : 'text-yellow-400'}`}>
                {debt.isOverdue ? 'Mensalidade Vencida!' : 'Mensalidade Pendente'}
              </p>
              <p className="text-slate-400 text-[11px] font-bold mt-0.5">
                {debt.pendingCount} cobrança{debt.pendingCount > 1 ? 's' : ''} · {Number(debt.pendingAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                {debt.nextDueDate && !debt.isOverdue && (
                  <> · vence {new Date(debt.nextDueDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</>
                )}
                {debt.isOverdue && ' · entre em contato com o organizador'}
              </p>
            </div>
          </div>
        )}


        {loadingOrganizationData && (
          <div className="flex items-center gap-3 p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 animate-in fade-in duration-300">
            <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
            <p className="text-emerald-300 text-[11px] font-black uppercase tracking-wide">Sincronizando dados da organização selecionada...</p>
          </div>
        )}

        {/* Tabs */}
        <TabsNavigation
          activeCategory={ui.activeCategory}
          onCategoryChange={ui.setActiveCategory}
          getCategoryCount={getCategoryCount}
        />

        {/* Content */}
        <div className="space-y-4">
          {ui.activeCategory === 'ranking' ? (
            <RankingTab
              selectedOrganizationId={activeOrganizationId}
              userPositions={userProfile.positions}
              isGoalkeeper={userProfile.is_goalkeeper}
              onPlayerClick={(p) => {
                modals.setSelectedPlayerData({
                  name: p.name,
                  is_goalkeeper: p.is_goalkeeper,
                  stats: p.stats,
                  avatar: p.avatar
                });
                modals.openModal('isMiniStatsOpen');
              }}
            />
          ) : (ui.loading || loadingOrganizationData) ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="py-20 text-center bg-slate-900/40 rounded-[2.5rem] border border-dashed border-slate-800 text-slate-500 font-medium">
              Nenhuma partida encontrada nesta categoria.
            </div>
          ) : (
            filteredMatches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                userProfile={userProfile}
                isSuperAdmin={isSuperAdmin}
                isOrganizationAdmin={isOrganizationAdmin}
                activeAdminMenu={ui.activeAdminMenu}
                setActiveAdminMenu={ui.setActiveAdminMenu}
                onOpenPlayers={() => {
                  modals.setSelectedMatchId(match.id);
                  modals.openModal('isMatchPlayersModalOpen');
                }}
                onOpenVote={() => {
                  modals.setSelectedMatchId(match.id);
                  modals.openModal('isPlayerVoteOpen');
                }}
                onOpenSummary={() => {
                  modals.setSelectedMatchId(match.id);
                  modals.openModal('isMatchSummaryOpen');
                }}
                onOpenTeamSorting={() => {
                  modals.setSelectedMatchId(match.id);
                  modals.openModal('isTeamSortingOpen');
                }}
                onOpenComments={() => {
                  modals.setSelectedMatchId(match.id);
                  modals.openModal('isMatchCommentsOpen');
                }}
                onOpenAdminManagement={() => {
                  modals.setSelectedMatchId(match.id);
                  modals.openModal('isAdminManagementOpen');
                }}
                onOpenMatchFinish={() => {
                  modals.setSelectedMatchId(match.id);
                  modals.openModal('isMatchFinishOpen');
                }}
                onOpenVotingStatus={() => dashboardHandlers.handleOpenVotingStatus(match.id)}
                onOpenDeleteConfirm={() => {
                  modals.setSelectedMatchId(match.id);
                  modals.openModal('isDeleteConfirmOpen');
                }}
              />
            ))
          )}
        </div>
          </>
        )}
      </div>

      {/* Todos os Modais */}
      <AllModals
        modals={modals}
        userProfile={userProfile}
        userStats={userStats}
        avatar={avatar}
        isSuperAdmin={isSuperAdmin}
        isOrganizationAdmin={isOrganizationAdmin}
        selectedOrganizationId={activeOrganizationId}
        loading={ui.loading}
        onFetchMatches={fetchMatches}
        onFetchUserProfile={fetchUserProfile}
        onDeleteMatch={dashboardHandlers.handleDeleteMatch}
        onAvatarSave={dashboardHandlers.handleAvatarSave}
        onAvatarRemove={dashboardHandlers.handleAvatarRemove}
      />
    </div>
  );
};

export default App;

