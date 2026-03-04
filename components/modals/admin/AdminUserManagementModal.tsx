import React, { useEffect, useMemo, useState } from 'react';
import { supabase, Player, DAY_SHORT } from '@/services/supabase';
import { PlayerPositionSelectorModal } from '../player/PlayerPositionSelectorModal.tsx';
import { SUPER_ADMIN_IDS } from '@/constants/app.constants';
import { OrganizationMember } from '@/hooks/useOrganizations.hook';

interface AdminUserManagementModalProps {
  isOpen: boolean;
  currentUserId: string;
  organizationId: string | null;
  isOrganizationAdmin: boolean;
  onClose: () => void;
  onGetOrganizationMembers: (organizationId: string) => Promise<OrganizationMember[]>;
  onSetOrganizationMemberAdmin: (organizationId: string, memberId: string, isAdmin: boolean) => Promise<void>;
  onRemoveOrganizationMember: (organizationId: string, memberId: string) => Promise<void>;
}

export const AdminUserManagementModal: React.FC<AdminUserManagementModalProps> = ({
  isOpen,
  currentUserId,
  organizationId,
  isOrganizationAdmin,
  onClose,
  onGetOrganizationMembers,
  onSetOrganizationMemberAdmin,
  onRemoveOrganizationMember,
}) => {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([]);
  const [search, setSearch] = useState('');
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [editingPositionsUserId, setEditingPositionsUserId] = useState<string | null>(null);

  const isSuperUser = SUPER_ADMIN_IDS.includes(currentUserId);
  const isOrganizationScope = !!organizationId;
  const canManageGlobalUsers = isSuperUser && !isOrganizationScope;
  const canManageOrganizationUsers = isOrganizationAdmin && isOrganizationScope;

  const loadPlayers = async () => {
    setLoading(true);
    try {
      if (canManageGlobalUsers) {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setPlayers(data || []);
        return;
      }

      if (!canManageOrganizationUsers || !organizationId) {
        setPlayers([]);
        return;
      }

      const members = await onGetOrganizationMembers(organizationId);
      setOrganizationMembers(members);
      const memberIds = members.map((m) => m.player_id);

      if (memberIds.length === 0) {
        setPlayers([]);
        return;
      }

      const { data, error } = await supabase
        .from('players')
        .select('*')
        .in('id', memberIds)
        .order('name', { ascending: true });

      if (error) throw error;
      setPlayers(data || []);
    } catch (e: any) {
      console.error(e);
      setMessage({ type: 'error', text: e.message || 'Erro ao carregar usuários.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && (canManageGlobalUsers || canManageOrganizationUsers)) {
      loadPlayers();
      setResettingUserId(null);
      setMessage(null);
      setNewPassword('');
    }
  }, [isOpen, canManageGlobalUsers, canManageOrganizationUsers]);

  const memberAdminMap = useMemo(() => {
    return organizationMembers.reduce<Record<string, boolean>>((acc, member) => {
      acc[member.player_id] = member.is_admin;
      return acc;
    }, {});
  }, [organizationMembers]);

  const filteredPlayers = useMemo(() => {
    return players.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search)
    );
  }, [players, search]);

  const handleDeleteUser = async (userId: string) => {
    if (!canManageGlobalUsers) {
      setMessage({ type: 'error', text: 'Acesso negado: apenas super admins podem excluir usuários.' });
      return;
    }

    if (!userId || SUPER_ADMIN_IDS.includes(userId) || userId === currentUserId) return;
    const confirm = window.confirm('Confirma exclusão permanente deste usuário e todos os seus dados?');
    if (!confirm) return;

    setDeletingUserId(userId);
    setActionLoading(true);
    setMessage(null);

    try {
      await supabase.from('player_votes').delete().or(`voter_id.eq.${userId},target_player_id.eq.${userId}`);
      await supabase.from('match_players').delete().eq('player_id', userId);
      await supabase.from('match_comments').delete().eq('player_id', userId);
      await supabase.from('player_stats').delete().eq('player_id', userId);
      await supabase.from('organization_players').delete().eq('player_id', userId);

      const { data: deletedPlayer, error: delPlayerError } = await supabase
        .from('players')
        .delete()
        .eq('id', userId)
        .select();

      if (delPlayerError) throw new Error(delPlayerError.message);
      if (!deletedPlayer || deletedPlayer.length === 0) throw new Error('Usuário não foi deletado. Verifique o RLS.');

      setMessage({ type: 'success', text: 'Usuário removido com sucesso!' });
      await loadPlayers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao deletar usuário.' });
    } finally {
      setDeletingUserId(null);
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resettingUserId || newPassword.length < 6) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.admin.updateUserById(resettingUserId, { password: newPassword });
      if (error) throw error;

      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setNewPassword('');
      setTimeout(() => setResettingUserId(null), 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao alterar senha.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleOrgAdmin = async (playerId: string, nextIsAdmin: boolean) => {
    if (!organizationId) return;

    setActionLoading(true);
    setMessage(null);
    try {
      await onSetOrganizationMemberAdmin(organizationId, playerId, nextIsAdmin);
      setMessage({ type: 'success', text: nextIsAdmin ? 'Usuário promovido a admin da organização.' : 'Permissão de admin removida.' });
      await loadPlayers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao atualizar permissão.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFromOrganization = async (playerId: string) => {
    if (!organizationId) return;
    if (playerId === currentUserId) {
      setMessage({ type: 'error', text: 'Você não pode remover a si mesmo da organização por aqui.' });
      return;
    }

    const confirmed = window.confirm('Remover este usuário da organização atual?');
    if (!confirmed) return;

    setDeletingUserId(playerId);
    setActionLoading(true);
    setMessage(null);
    try {
      await onRemoveOrganizationMember(organizationId, playerId);
      setMessage({ type: 'success', text: 'Usuário removido da organização.' });
      await loadPlayers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao remover usuário da organização.' });
    } finally {
      setDeletingUserId(null);
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const canManage = canManageGlobalUsers || canManageOrganizationUsers;

  return (
    <>
      {canManage && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
        <div className="w-full h-full sm:h-auto sm:max-w-2xl bg-slate-950 sm:bg-slate-900 border-none sm:border sm:border-slate-800 sm:rounded-[2.5rem] overflow-hidden flex flex-col max-h-screen sm:max-h-[85vh] shadow-2xl">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Gestão de Usuários</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                {canManageGlobalUsers ? 'Recuperação de Acesso e Exclusão Global' : 'Gerenciamento de Membros da Organização'}
              </p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-2xl transition-colors text-slate-400">✕</button>
          </div>

          <div className="p-6 border-b border-slate-800 bg-slate-950/20">
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm text-white"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {loading ? <p className="text-slate-400 text-xs">Carregando...</p> : filteredPlayers.map((p) => {
              const orgIsAdmin = !!memberAdminMap[p.id];
              return (
                <div key={p.id} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-white font-bold text-sm">{p.name}</p>
                      <p className="text-slate-400 text-xs">+55 {p.phone} • {canManageGlobalUsers ? (p.is_admin ? 'Administrador Global' : 'Jogador') : (orgIsAdmin ? 'Admin da Org' : 'Membro')}</p>
                      {!!p.match_days?.length && <p className="text-slate-500 text-[10px] mt-1">{p.match_days.map((d) => DAY_SHORT[d]).join(' · ')}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {canManageGlobalUsers && (
                        <button onClick={() => setEditingPositionsUserId(p.id)} className="px-3 py-2 rounded-xl text-[10px] font-black uppercase bg-blue-600 text-white">Posições</button>
                      )}

                      {canManageGlobalUsers ? (
                        <>
                          <button onClick={() => setResettingUserId(resettingUserId === p.id ? null : p.id)} className="px-3 py-2 rounded-xl text-[10px] font-black uppercase bg-emerald-600 text-slate-950">Senha</button>
                          <button onClick={() => handleDeleteUser(p.id)} disabled={actionLoading || deletingUserId === p.id || SUPER_ADMIN_IDS.includes(p.id) || p.id === currentUserId} className="px-3 py-2 rounded-xl text-[10px] font-black uppercase bg-red-600 text-white disabled:opacity-50">Deletar</button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleToggleOrgAdmin(p.id, !orgIsAdmin)}
                            disabled={actionLoading || p.id === currentUserId}
                            className="px-3 py-2 rounded-xl text-[10px] font-black uppercase bg-indigo-600 text-white disabled:opacity-50"
                          >
                            {orgIsAdmin ? 'Remover Admin' : 'Tornar Admin'}
                          </button>
                          <button
                            onClick={() => handleRemoveFromOrganization(p.id)}
                            disabled={actionLoading || deletingUserId === p.id || p.id === currentUserId}
                            className="px-3 py-2 rounded-xl text-[10px] font-black uppercase bg-red-600 text-white disabled:opacity-50"
                          >
                            Remover da Org
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {canManageGlobalUsers && resettingUserId === p.id && (
                    <div className="space-y-2 pt-2 border-t border-slate-700">
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova senha" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white" />
                      <button onClick={handleResetPassword} disabled={actionLoading || newPassword.length < 6} className="w-full py-2 rounded-xl bg-emerald-600 text-slate-950 text-xs font-black uppercase disabled:opacity-50">Salvar nova senha</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {message && <p className={`mx-4 mb-4 text-center py-2 rounded-lg text-[11px] font-black ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{message.text}</p>}
        </div>
      </div>
      )}

      {!canManage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl p-6">
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-4">Acesso Negado</h2>
            <p className="text-sm text-slate-400">Apenas admins globais ou da organização ativa podem gerenciar usuários.</p>
            <button onClick={onClose} className="mt-6 w-full py-3 bg-emerald-600 text-slate-950 font-black text-xs uppercase rounded-xl">Fechar</button>
          </div>
        </div>
      )}

      {editingPositionsUserId && (
        <PlayerPositionSelectorModal
          isOpen={true}
          onClose={() => setEditingPositionsUserId(null)}
          playerId={editingPositionsUserId}
          playerName={players.find(p => p.id === editingPositionsUserId)?.name || ''}
          isGoalkeeper={players.find(p => p.id === editingPositionsUserId)?.is_goalkeeper || false}
          currentPositions={players.find(p => p.id === editingPositionsUserId)?.positions || null}
          onSave={() => {
            loadPlayers();
            setEditingPositionsUserId(null);
          }}
        />
      )}
    </>
  );
};
