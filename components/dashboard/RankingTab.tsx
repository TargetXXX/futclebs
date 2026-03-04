
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { supabase, PlayerStats } from '../../services/supabase.ts';
import { FullRankingModal } from '../modals/player/FullRankingModal.tsx';
import { calculateByPosition } from '@/utils/overall.utils.ts';

interface RankingPlayer {
  id: string;
  name: string;
  is_goalkeeper: boolean;
  stats: PlayerStats | null;
  avatar: string | null;
  positions?: String[] | null;
}

interface Season {
  id: string;
  name: string;
  started_at: string;
  ended_at: string | null;
  match_count?: number;
}

interface RankingTabProps {
  onPlayerClick: (player: RankingPlayer) => void;
  selectedOrganizationId: string | null;
  userPositions?: String[] | null;
  isGoalkeeper?: boolean;
}

type PositionFilter = 'geral' | 'Ataque' | 'Meio' | 'Defesa' | 'Goleiro';

const POSITION_CONFIG: Record<PositionFilter, { label: string; emoji: string; color: string; accent: string }> = {
  geral:   { label: 'Geral',   emoji: '⚽', color: 'emerald', accent: 'text-emerald-500' },
  Ataque:  { label: 'Ataque',  emoji: '🔥', color: 'red',     accent: 'text-red-400' },
  Meio:    { label: 'Meio',    emoji: '🎯', color: 'blue',    accent: 'text-blue-400' },
  Defesa:  { label: 'Defesa',  emoji: '🛡️', color: 'violet',  accent: 'text-violet-400' },
  Goleiro: { label: 'Goleiro', emoji: '🧤', color: 'orange',  accent: 'text-orange-400' },
};

export const RankingTab: React.FC<RankingTabProps> = ({ onPlayerClick, selectedOrganizationId, userPositions, isGoalkeeper }) => {
  const [loading, setLoading] = useState(true);
  const [allPlayers, setAllPlayers] = useState<RankingPlayer[]>([]);
  const [fieldRanking, setFieldRanking] = useState<RankingPlayer[]>([]);
  const [gkRanking, setGkRanking] = useState<RankingPlayer[]>([]);
  const [isFullRankingOpen, setIsFullRankingOpen] = useState(false);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);

  const getDefaultFilter = (): PositionFilter => {
    if (isGoalkeeper) return 'Goleiro';
    if (userPositions?.includes('Ataque')) return 'Ataque';
    if (userPositions?.includes('Meio')) return 'Meio';
    if (userPositions?.includes('Defesa')) return 'Defesa';
    return 'geral';
  };

  const [positionFilter, setPositionFilter] = useState<PositionFilter>(getDefaultFilter);

  useEffect(() => {
    if (!selectedOrganizationId) return;
    fetchRankings();
    fetchActiveSeason();
  }, [selectedOrganizationId]);

  const fetchActiveSeason = async () => {
    try {
      if (!selectedOrganizationId) return;

      const { data } = await supabase
        .from('seasons')
        .select('*')
        .order('started_at', { ascending: false });

      if (!data || data.length === 0) return;

      const now = new Date();
      const active = data.find((s: any) => !s.ended_at || new Date(s.ended_at) > now);
      if (!active) return;

      // Contar partidas finalizadas no período
      const { data: matches } = await supabase
        .from('matches')
        .select('id, match_date')
        .eq('status', 'finished')
        .eq('organization_id', selectedOrganizationId);

      let count = 0;
      if (matches) {
        const start = new Date(active.started_at);
        const end = active.ended_at ? new Date(active.ended_at) : new Date('2099-01-01');
        count = matches.filter((m: any) => {
          const d = new Date(m.match_date);
          return d >= start && d <= end;
        }).length;
      }

      setActiveSeason({ ...active, match_count: count });
    } catch (err) {
      console.error('Erro ao buscar temporada:', err);
    }
  };

  const fetchRankings = async () => {
    if (!selectedOrganizationId) {
      setAllPlayers([]);
      setFieldRanking([]);
      setGkRanking([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: organizationPlayers, error: organizationPlayersError } = await supabase
        .from('organization_players')
        .select('player_id')
        .eq('organization_id', selectedOrganizationId);

      if (organizationPlayersError) throw organizationPlayersError;

      const organizationPlayerIds = (organizationPlayers || []).map((item: any) => item.player_id);

      if (organizationPlayerIds.length === 0) {
        setAllPlayers([]);
        setFieldRanking([]);
        setGkRanking([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('players')
        .select(`
          id,
          name,
          is_goalkeeper,
          player_stats (player_id, velocidade, finalizacao, passe, drible, defesa, fisico, esportividade),
          avatar,
          positions
        `)
        .in('id', organizationPlayerIds);

      if (error) throw error;
     

      const players: RankingPlayer[] = (data as any[]).map(p => ({
        
        id: p.id,
        name: p.name,
        is_goalkeeper: p.is_goalkeeper,
        stats: p.player_stats ? {...p.player_stats, overall: calculateByPosition(p, p.player_stats)} : null,
        avatar: p.avatar,
        positions: p.positions || null
      }));

      setAllPlayers(players);

      // Ordenar por Overall para os Top 3
      const sortedField = [...players]
        .filter(p => !p.is_goalkeeper)
        .sort((a, b) => (b.stats?.overall || 0) - (a.stats?.overall || 0))
        .slice(0, 3);

      const sortedGk = [...players]
        .filter(p => p.is_goalkeeper)
        .sort((a, b) => (b.stats?.overall || 0) - (a.stats?.overall || 0))
        .slice(0, 3);

      setFieldRanking(sortedField);
      setGkRanking(sortedGk);
    } catch (err) {
      console.error('Erro ao buscar rankings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Montando o Hall da Fama...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-8 animate-in fade-in duration-700 pb-20">

      {/* Banner da Temporada Ativa */}
      {activeSeason && <SeasonBanner season={activeSeason} />}

      {/* Seletor de posição */}
      <div className="grid grid-cols-5 gap-1 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
        {(Object.keys(POSITION_CONFIG) as PositionFilter[]).map(pos => {
          const cfg = POSITION_CONFIG[pos];
          const active = positionFilter === pos;
          return (
            <button
              key={pos}
              onClick={() => setPositionFilter(pos)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-xl font-black text-[9px] uppercase tracking-wide transition-all border ${
                active
                  ? `bg-${cfg.color}-500/20 border-${cfg.color}-500/40 ${cfg.accent}`
                  : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-sm leading-none">{cfg.emoji}</span>
              <span className="leading-none mt-0.5">{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Ver ranking completo */}
      <div className="flex justify-center">
        <button
          onClick={() => setIsFullRankingOpen(true)}
          className="group relative px-8 py-4 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all active:scale-95"
        >
          <div className="flex items-center gap-3 relative z-10">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="text-xs font-black text-white uppercase tracking-widest">Ver Ranking Completo</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </button>
      </div>

      {/* Rankings por posição */}
      {positionFilter === 'geral' ? (
        <>
          <RankingSection
            title="Elite de Linha"
            subtitle="O Top 3 Atual"
            accentClass="text-emerald-500"
            players={fieldRanking}
            onPlayerClick={onPlayerClick}
            variant="emerald"
          />
          <RankingSection
            title="Muralhas"
            subtitle="Os Guardiões Imbatíveis"
            accentClass="text-orange-500"
            players={gkRanking}
            onPlayerClick={onPlayerClick}
            variant="orange"
          />
        </>
      ) : positionFilter === 'Goleiro' ? (
        <RankingSection
          title="Muralhas"
          subtitle="Top Goleiros"
          accentClass="text-orange-400"
          players={[...allPlayers]
            .filter(p => p.is_goalkeeper)
            .sort((a, b) => (b.stats?.overall || 0) - (a.stats?.overall || 0))
            .slice(0, 3)}
          onPlayerClick={onPlayerClick}
          variant="orange"
        />
      ) : (
        <RankingSection
          title={`Top ${POSITION_CONFIG[positionFilter].label}`}
          subtitle={`Melhores ${POSITION_CONFIG[positionFilter].label}s`}
          accentClass={POSITION_CONFIG[positionFilter].accent}
          players={[...allPlayers]
            .filter(p => !p.is_goalkeeper && p.positions?.includes(positionFilter))
            .sort((a, b) => (b.stats?.overall || 0) - (a.stats?.overall || 0))
            .slice(0, 3)}
          onPlayerClick={onPlayerClick}
          variant={positionFilter === 'Ataque' ? 'red' : positionFilter === 'Meio' ? 'blue' : 'violet'}
        />
      )}

      </div>

      {ReactDOM.createPortal(
        <FullRankingModal
          isOpen={isFullRankingOpen}
          onClose={() => setIsFullRankingOpen(false)}
          players={allPlayers}
          onPlayerClick={(p) => onPlayerClick(p)}
        />,
        document.body
      )}
    </>
  );
};

type PodiumVariant = 'emerald' | 'orange' | 'red' | 'blue' | 'violet';

const RankingSection: React.FC<{
  title: string;
  subtitle: string;
  accentClass: string;
  players: RankingPlayer[];
  onPlayerClick: (p: RankingPlayer) => void;
  variant: PodiumVariant;
}> = ({ title, subtitle, accentClass, players, onPlayerClick, variant }) => (
  <section>
    <div className="text-center mb-24">
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{title}</h2>
      <p className={`text-[9px] font-black uppercase tracking-[0.3em] mt-2 ${accentClass}`}>{subtitle}</p>
    </div>
    {players.length > 0 ? (
      <Podium players={players} onPlayerClick={onPlayerClick} variant={variant} />
    ) : (
      <EmptyState />
    )}
  </section>
);

const SeasonBanner: React.FC<{ season: Season }> = ({ season }) => {  const formatDate = (iso: string) =>
    new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  const now = new Date();
  const end = season.ended_at ? new Date(season.ended_at) : null;
  const totalMs = end ? end.getTime() - new Date(season.started_at).getTime() : null;
  const elapsedMs = now.getTime() - new Date(season.started_at).getTime();
  const progress = totalMs ? Math.min(100, Math.round((elapsedMs / totalMs) * 100)) : null;

  const daysLeft = end ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-500/10 via-slate-900 to-slate-900 border border-yellow-500/20 p-5">
      {/* Glow decorativo */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center shrink-0">
            <span className="text-lg">🏆</span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500/70 mb-0.5">Temporada Ativa</p>
            <p className="text-white font-black text-sm leading-tight">{season.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-yellow-400 text-[10px] font-black uppercase tracking-wider">Ao vivo</span>
        </div>
      </div>

      <div className="relative z-10 mt-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-slate-300 text-[10px] font-bold">
            {formatDate(season.started_at)}{end ? ` → ${formatDate(season.ended_at!)}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
          <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-slate-300 text-[10px] font-bold">{season.match_count ?? 0} partida(s)</span>
        </div>

        {daysLeft !== null && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold ${
            daysLeft <= 7
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-slate-800/60 border-slate-700/40 text-slate-300'
          }`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {daysLeft === 0 ? 'Encerra hoje!' : `${daysLeft} dia(s) restante(s)`}
          </div>
        )}
      </div>

      {progress !== null && (
        <div className="relative z-10 mt-3 space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-500">
            <span>Progresso</span>
            <span className="text-yellow-500">{progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};


const Podium: React.FC<{ players: RankingPlayer[], onPlayerClick: (p: RankingPlayer) => void, variant?: PodiumVariant }> = ({ players, onPlayerClick, variant = 'emerald' }) => {
  const podiumOrder: (RankingPlayer & { rank: number })[] = [];
  if (players[1]) podiumOrder.push({ ...players[1], rank: 2 });
  if (players[0]) podiumOrder.push({ ...players[0], rank: 1 });
  if (players[2]) podiumOrder.push({ ...players[2], rank: 3 });

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6 px-4 h-64 sm:h-72">
      {podiumOrder.map((player) => (
        <PodiumStep
          key={player.id}
          player={player}
          rank={player.rank}
          onClick={() => onPlayerClick(player)}
          variant={variant}
        />
      ))}
    </div>
  );
};

const VARIANT_COLORS: Record<PodiumVariant, { border: string; bg: string; text: string }> = {
  emerald: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  orange:  { border: 'border-orange-500/40',  bg: 'bg-orange-500/10',  text: 'text-orange-400' },
  red:     { border: 'border-red-500/40',      bg: 'bg-red-500/10',     text: 'text-red-400' },
  blue:    { border: 'border-blue-500/40',     bg: 'bg-blue-500/10',    text: 'text-blue-400' },
  violet:  { border: 'border-violet-500/40',   bg: 'bg-violet-500/10',  text: 'text-violet-400' },
};

const PodiumStep: React.FC<{ player: RankingPlayer, rank: number, onClick: () => void, variant: PodiumVariant }> = ({ player, rank, onClick, variant }) => {
  const isFirst = rank === 1;
  const isSecond = rank === 2;

  const heightClass = 'h-full';
  
  const colorClass = isFirst ? 'from-yellow-400 to-yellow-600 shadow-yellow-500/30' : 
                     isSecond ? 'from-slate-300 to-slate-500 shadow-slate-400/20' : 
                     'from-amber-600 to-amber-800 shadow-amber-700/20';
  

  const overall = player.stats?.overall ?? 0;

  return (
    <div 
      onClick={onClick}
      className={`relative flex flex-col items-center justify-end w-full max-w-[130px] transition-all duration-700 cursor-pointer group hover:-translate-y-2 ${heightClass}`}
    >
      {/* Avatar Section - Todos na mesma altura */}
      <div className={`absolute -top-16 sm:-top-20 z-20 flex flex-col items-center animate-in zoom-in duration-1000 delay-300`}>
        {isFirst && (
          <div className="animate-bounce mb-1">
            <svg className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a3 3 0 01-3-3V6zm3 2V5a1 1 0 00-1 1v4a1 1 0 001 1h8l-2-2.667L14 8l-2-2.667L10 8l-2-2.667L6 8z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {!isFirst && <div className="h-9"></div> /* Espaçador para manter altura uniforme quando não há coroa */}
        
        <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full border-4 flex items-center justify-center font-black text-white text-xl sm:text-3xl shadow-2xl overflow-hidden relative transition-transform group-hover:scale-110 ${
          isFirst ? 'border-yellow-500 bg-yellow-500/20' : 
          isSecond ? 'border-slate-400 bg-slate-400/20' : 
          'border-amber-700 bg-amber-700/20'
        }`}>
          {player.avatar ? (
            <img 
              src={player.avatar}
              alt="Avatar"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span className="text-white font-black text-xl sm:text-3xl">
              {player.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
      </div>

      {/* Visual Block of the Podium - Uniforme */}
      <div className={`w-full bg-gradient-to-b ${colorClass} rounded-t-[2rem] shadow-2xl flex flex-col items-center pt-8 pb-5 relative overflow-hidden group-hover:brightness-110 transition-all border-x border-t border-white/20`}>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        
        <span className="text-black/10 text-8xl font-black absolute -bottom-6 left-1/2 -translate-x-1/2 select-none italic pointer-events-none">
          {rank}
        </span>

        <div className="relative z-10 flex flex-col items-center text-center px-2">
          <span className="text-slate-950 font-black text-3xl sm:text-4xl leading-none tabular-nums drop-shadow-md">
            {overall}
          </span>
          <span className="text-slate-950/50 font-black text-[9px] uppercase tracking-widest mt-1">
            OVR
          </span>
        </div>
      </div>

      {/* Name and decorative line */}
      <div className="mt-4 text-center w-full px-2">
        <p className={`text-[11px] font-black truncate leading-tight ${isFirst ? 'text-white' : 'text-slate-400'}`}>
          {player.name.split(' ')[0]}
        </p>
        <div className={`mt-1 mx-auto h-0.5 w-8 rounded-full ${VARIANT_COLORS[variant].bg} border ${VARIANT_COLORS[variant].border}`} />
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="text-center py-10 opacity-30">
    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-700">
      <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
      </svg>
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Aguardando dados da rodada...</p>
  </div>
);
