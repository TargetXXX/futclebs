
import React, { useState, useEffect } from 'react';
import { supabase, PlayerStats } from '../services/supabase';

interface PlayerVoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  currentUserId: string;
  onRefresh: () => void;
}

interface VoteTarget {
  id: string;
  name: string;
  is_goalkeeper: boolean;
}

export const PlayerVoteModal: React.FC<PlayerVoteModalProps> = ({ isOpen, onClose, matchId, currentUserId, onRefresh }) => {
  const [playersToVote, setPlayersToVote] = useState<VoteTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [currentRatings, setCurrentRatings] = useState({
    velocidade: 3,
    finalizacao: 3,
    passe: 3,
    drible: 3,
    defesa: 3,
    fisico: 3
  });

  useEffect(() => {
    if (isOpen && matchId) loadPlayers();
  }, [isOpen, matchId]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const { data: participants } = await supabase
        .from('match_players')
        .select('player_id, players(name, is_goalkeeper)')
        .eq('match_id', matchId)
        .neq('player_id', currentUserId);

      const { data: alreadyVoted } = await supabase
        .from('player_votes')
        .select('target_player_id')
        .eq('match_id', matchId)
        .eq('voter_id', currentUserId);

      const votedIds = new Set(alreadyVoted?.map(v => v.target_player_id) || []);
      
      if (participants) {
        const remaining = participants
          .filter((p: any) => !votedIds.has(p.player_id))
          .map((p: any) => ({
            id: p.player_id,
            name: p.players.name,
            is_goalkeeper: p.players.is_goalkeeper
          }));
        setPlayersToVote(remaining);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNextVote = async () => {
    if (submitting || playersToVote.length === 0) return;
    
    setSubmitting(true);
    const target = playersToVote[currentIndex];
    
    try {
      // SALVAMOS 1-5 NO BANCO
      const ratingsToSubmit = {
        velocidade: currentRatings.velocidade,
        finalizacao: currentRatings.finalizacao,
        passe: currentRatings.passe,
        drible: currentRatings.drible,
        defesa: currentRatings.defesa,
        fisico: currentRatings.fisico
      };

      const { error } = await supabase.from('player_votes').insert({
        match_id: matchId,
        voter_id: currentUserId,
        target_player_id: target.id,
        ...ratingsToSubmit
      });

      if (error) throw error;

      if (currentIndex < playersToVote.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setCurrentRatings({
          velocidade: 3,
          finalizacao: 3,
          passe: 3,
          drible: 3,
          defesa: 3,
          fisico: 3
        });
      } else {
        onRefresh();
        onClose();
      }
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar: " + (e.message || "Tente novamente"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentPlayer = playersToVote[currentIndex];

  // Definição dos atributos para mapeamento
  const allAttributes = [
    { key: 'velocidade', label: 'Velocidade' },
    { key: 'finalizacao', label: 'Finalização' },
    { key: 'passe', label: 'Passe' },
    { key: 'drible', label: 'Drible' },
    { key: 'defesa', label: 'Defesa' },
    { key: 'fisico', label: 'Físico' },
  ] as const;

  // Filtra os atributos baseando-se se o jogador é goleiro ou não
  const visibleAttributes = currentPlayer?.is_goalkeeper
    ? allAttributes.filter(attr => attr.key === 'passe' || attr.key === 'defesa')
    : allAttributes;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-4 bg-black/98 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="w-full h-full md:h-auto md:max-w-md bg-slate-900 md:border md:border-slate-800 md:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Avaliação de Craques</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Sua opinião define o Overall do grupo</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-32">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-slate-500 font-black uppercase text-[10px]">Preparando cédulas...</p>
            </div>
          ) : playersToVote.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-white font-black uppercase text-sm">Votação Concluída!</p>
              <p className="text-slate-500 text-xs">Você já avaliou todos os participantes.</p>
              <button onClick={onClose} className="mt-4 px-8 py-3 bg-slate-800 text-white rounded-xl text-xs font-black uppercase">Fechar</button>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <div className="text-center">
                <p className="text-slate-500 text-[10px] font-black uppercase mb-2">Jogador {currentIndex + 1} de {playersToVote.length}</p>
                <h3 className="text-2xl font-black text-white">{currentPlayer.name}</h3>
                <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${currentPlayer.is_goalkeeper ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
                  {currentPlayer.is_goalkeeper ? 'Goleiro' : 'Jogador de Linha'}
                </span>
              </div>

              <div className="space-y-6">
                {visibleAttributes.map(attr => (
                  <RatingRow 
                    key={attr.key}
                    label={attr.label} 
                    value={currentRatings[attr.key as keyof typeof currentRatings]} 
                    onChange={v => setCurrentRatings(r => ({...r, [attr.key]: v}))} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {!loading && playersToVote.length > 0 && (
          <div className="p-6 bg-slate-900 border-t border-slate-800">
            <button 
              onClick={handleNextVote}
              disabled={submitting}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase rounded-2xl transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              {submitting ? <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" /> : (
                <>
                  {currentIndex === playersToVote.length - 1 ? 'Finalizar Todas Avaliações' : 'Próximo Jogador'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Fix: Use React.FC for RatingRow to resolve 'key' prop TypeScript error
const RatingRow: React.FC<{ label: string, value: number, onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between items-center px-1">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-emerald-500/60 tabular-nums">{value * 20} pts</span>
        <span className="text-xs font-black text-emerald-500">{value === 5 ? 'Elite' : value === 4 ? 'Bom' : value === 3 ? 'Médio' : value === 2 ? 'Baixo' : 'Ruim'}</span>
      </div>
    </div>
    <div className="flex justify-between gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className={`flex-1 h-12 rounded-xl border transition-all flex items-center justify-center ${
            star <= value 
              ? 'bg-orange-500/10 border-orange-500/40 text-orange-500 shadow-inner' 
              : 'bg-slate-800/50 border-slate-700/50 text-slate-600'
          }`}
        >
          <svg className={`w-5 h-5 ${star <= value ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      ))}
    </div>
  </div>
);
