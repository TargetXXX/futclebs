import React, { useMemo, useState } from 'react';
import { Organization } from '../../hooks/useOrganizations.hook';

interface OrganizationAccessPanelProps {
  isSuperAdmin: boolean;
  onSearchOrganizations: (query: string) => Promise<Organization[]>;
  onJoinOrganization: (organizationId: string, password: string) => Promise<void>;
  onCreateOrganization: (payload: { name: string; description?: string; password: string }) => Promise<void>;
}

export const OrganizationAccessPanel: React.FC<OrganizationAccessPanelProps> = ({
  isSuperAdmin,
  onSearchOrganizations,
  onJoinOrganization,
  onCreateOrganization,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Organization[]>([]);
  const [searching, setSearching] = useState(false);

  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');
  const [newOrgPassword, setNewOrgPassword] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const hasSearch = useMemo(() => searchTerm.trim().length > 0, [searchTerm]);

  const handleSearch = async (event?: React.FormEvent) => {
    event?.preventDefault();

    if (!hasSearch) {
      setSearchResults([]);
      setMessage(null);
      return;
    }

    setSearching(true);
    setMessage(null);

    try {
      const data = await onSearchOrganizations(searchTerm);
      setSearchResults(data);

      if (data.length === 0) {
        setMessage({ type: 'error', text: 'Nenhuma organização encontrada com esse nome.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao pesquisar organizações.' });
    } finally {
      setSearching(false);
    }
  };

  const handleJoin = async () => {
    if (!joiningId) return;

    setJoinLoading(true);
    setMessage(null);

    try {
      await onJoinOrganization(joiningId, joinPassword);
      setMessage({ type: 'success', text: 'Você entrou na organização com sucesso!' });
      setSearchResults((prev) => prev.filter((org) => org.id !== joiningId));
      setJoiningId(null);
      setJoinPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao entrar na organização.' });
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    setCreateLoading(true);
    setMessage(null);

    try {
      await onCreateOrganization({
        name: newOrgName,
        description: newOrgDescription,
        password: newOrgPassword,
      });

      setMessage({ type: 'success', text: 'Organização criada com sucesso!' });
      setNewOrgName('');
      setNewOrgDescription('');
      setNewOrgPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao criar organização.' });
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-slate-900/40 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4">
      <div className="absolute -top-16 -left-16 w-36 h-36 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-3">
        <div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Acesso de organizações</p>
          <h3 className="text-white font-black text-sm">Entrar ou criar organização</h3>
        </div>

        {searching && (
          <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] font-black uppercase tracking-wide animate-in fade-in duration-300">
            <span className="w-3 h-3 border-2 border-emerald-300/40 border-t-emerald-300 rounded-full animate-spin" />
            Buscando
          </div>
        )}
      </div>

      {message && (
        <div
          className={`relative z-10 px-3 py-2 rounded-xl border text-[11px] font-bold animate-in fade-in duration-300 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSearch} className="relative z-10 flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Pesquisar por nome da organização"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔎</span>
        </div>

        <button
          type="submit"
          disabled={searching || !hasSearch}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 text-[10px] font-black uppercase tracking-wide"
        >
          {searching ? 'Buscando...' : 'Pesquisar'}
        </button>
      </form>

      <div className="relative z-10 space-y-2">
        {searchResults.map((org) => {
          const isJoining = joiningId === org.id;

          return (
            <div
              key={org.id}
              className={`rounded-2xl border p-3 transition-all duration-300 ${
                isJoining
                  ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900 border-slate-700 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black text-white uppercase tracking-wide truncate">{org.name}</p>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {org.description?.trim() || 'Sem descrição cadastrada para esta organização.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setJoiningId((prev) => (prev === org.id ? null : org.id));
                    setJoinPassword('');
                  }}
                  className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                    isJoining
                      ? 'bg-slate-800 border-slate-600 text-slate-200'
                      : 'bg-emerald-600 border-emerald-500 text-slate-950 hover:bg-emerald-500'
                  }`}
                >
                  {isJoining ? 'Cancelar' : 'Entrar'}
                </button>
              </div>

              {isJoining && (
                <div className="mt-3 flex flex-col sm:flex-row gap-2 animate-in fade-in duration-300">
                  <input
                    type="password"
                    value={joinPassword}
                    onChange={(event) => setJoinPassword(event.target.value)}
                    placeholder="Digite a senha da organização"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={joinLoading || !joinPassword.trim()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 text-[10px] font-black uppercase"
                  >
                    {joinLoading ? 'Entrando...' : 'Confirmar entrada'}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {hasSearch && !searching && searchResults.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-4 text-center">
            <p className="text-slate-400 text-[11px] font-bold">Nenhuma organização disponível na busca.</p>
          </div>
        )}
      </div>

      {isSuperAdmin && (
        <form onSubmit={handleCreate} className="relative z-10 border-t border-slate-800 pt-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-white text-xs font-black uppercase tracking-wide">Criar organização</h4>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black bg-white text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-white/20">
              Super Admin
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              value={newOrgName}
              onChange={(event) => setNewOrgName(event.target.value)}
              placeholder="Nome da organização"
              className="sm:col-span-2 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <input
              value={newOrgDescription}
              onChange={(event) => setNewOrgDescription(event.target.value)}
              placeholder="Descrição (opcional)"
              className="sm:col-span-2 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="password"
              value={newOrgPassword}
              onChange={(event) => setNewOrgPassword(event.target.value)}
              placeholder="Senha da organização"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={createLoading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 text-[10px] font-black uppercase"
            >
              {createLoading ? 'Criando...' : 'Criar organização'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
};
