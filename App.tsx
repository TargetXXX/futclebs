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

// Components
import { AuthForm } from './components/auth/AuthForm.component';
import { DashboardHeader } from './components/dashboard/DashboardHeader.component';
import { StatsCard } from './components/dashboard/StatsCard.component';
import { TabsNavigation } from './components/dashboard/TabsNavigation.component';
import { MatchCard } from './components/dashboard/MatchCard.component';
import { RankingTab } from './components/dashboard/RankingTab';
import { AllModals } from './components/AllModals.component';

const App: React.FC = () => {
  // Core hooks
  const { session, initializing, signOut } = useAuth();
  const { userProfile, userStats, fetchUserProfile, updateUserProfile, setUserProfile } = useUserProfile();
  const { matches, fetchMatches, deleteMatch } = useMatches();
  const modals = useModals();
  const avatar = useAvatar(session?.user?.id || '', () => fetchUserProfile(session?.user?.id || ''));

  // Débito do jogador logado
  const { debt } = usePlayerDebt(userProfile?.id ?? null);

  // UI State
  const ui = useUIState();
  const form = useFormState();

  // Loading profile state
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Computed
  const isSuperAdmin = !!userProfile && SUPER_ADMIN_IDS.includes(userProfile.id);
  const { getFilteredMatches, getCategoryCount } = useMatchFilters(matches);
  const filteredMatches = getFilteredMatches(ui.activeCategory);

  // Load user data
  const loadUserData = useCallback(async (userId: string) => {
    setLoadingProfile(true);
    try {
      await Promise.all([fetchUserProfile(userId), fetchMatches(userId)]);
    } finally {
      setLoadingProfile(false);
    }
  }, [fetchUserProfile, fetchMatches]);

  // Auth handlers
  const authHandlers = useAuthHandlers(loadUserData, ui.setStep, ui.setError, ui.setLoading);

  // Dashboard handlers
  const dashboardHandlers = useDashboardHandlers(
    userProfile,
    isSuperAdmin,
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
          onOpenUserManagement={() => modals.openModal('isAdminUserManagementOpen')}
          onOpenCreateMatch={() => modals.openModal('isCreateMatchOpen')}
          onOpenSeasonModal={() => modals.openModal('isSeasonModalOpen')}
          onOpenWhatsAppConfig={() => modals.openModal('isWhatsAppConfigOpen')}
          onOpenFinancial={() => modals.openModal('isFinancialModalOpen')}
          onLogout={handleLogout}
        />

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
          ) : ui.loading ? (
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
      </div>

      {/* Todos os Modais */}
      <AllModals
        modals={modals}
        userProfile={userProfile}
        userStats={userStats}
        avatar={avatar}
        isSuperAdmin={isSuperAdmin}
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


