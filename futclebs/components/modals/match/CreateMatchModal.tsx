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
        match_date: matchDate,
        name: 'Pelada Futclebs',
      });

      onRefresh();
      onClose();
      setMatchDate('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar partida');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <Input label="Data da Partida" type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)} required />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 rounded-xl font-bold">
            {loading ? 'Criando...' : 'Criar Partida'}
          </button>
        </form>
      </div>
    </div>
  );
};
