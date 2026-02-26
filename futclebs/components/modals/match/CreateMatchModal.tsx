import React, { useState } from 'react';
import { api } from '../../../services/axios.ts';
import { Input } from '../shared/Input.tsx';

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({ isOpen, onClose, onRefresh }) => {
  const [matchDate, setMatchDate] = useState('');
  const [matchName, setMatchName] = useState('Rachão BOLANOPE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const organizationId = localStorage.getItem('orgId');
    if (!matchDate) return setError('Selecione uma data');
    if (!organizationId) return setError('Organização não selecionada');

    setLoading(true);
    setError(null);
    try {
      await api.post('/matches', {
        organization_id: Number(organizationId),
        match_date: `${matchDate} 20:00:00`,
        tournament_id: null,
        name: matchName.trim() || 'Rachão BOLANOPE',
      });

      onRefresh();
      onClose();
      setMatchDate('');
      setMatchName('Rachão BOLANOPE');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar partida');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in">
        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          <div>
            <h2 className="text-white font-black text-lg">Nova partida</h2>
            <p className="text-slate-400 text-xs mt-1">Crie um Rachão (partida avulsa) ou use o nome que quiser.</p>
          </div>
          <Input label="Nome da Partida" value={matchName} onChange={e => setMatchName(e.target.value)} required />
          <Input label="Data da Partida" type="date" min={new Date().toISOString().split('T')[0]} value={matchDate} onChange={e => setMatchDate(e.target.value)} required />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 transition rounded-xl font-bold text-white">
            {loading ? 'Criando...' : 'Criar Partida'}
          </button>
        </form>
      </div>
    </div>
  );
};
