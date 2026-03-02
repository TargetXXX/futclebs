import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export interface PlayerDebt {
  pendingAmount: number;
  pendingCount: number;
  isOverdue: boolean;
  nextDueDate: string | null;
}

export const usePlayerDebt = (playerId: string | null) => {
  const [debt, setDebt] = useState<PlayerDebt | null>(null);

  const fetchDebt = useCallback(async () => {
    if (!playerId) { setDebt(null); return; }

    const { data, error } = await supabase
      .from('financial_transactions')
      .select('id, amount, due_date, created_at')
      .eq('player_id', playerId)
      .eq('paid', false);

    if (error) { console.error('usePlayerDebt:', error.message); setDebt(null); return; }

    // Filtra apenas cobranças positivas (exclui descontos)
    const pending = (data || []).filter(tx => Number(tx.amount) > 0);

    if (pending.length === 0) { setDebt(null); return; }

    const today        = new Date().toISOString().split('T')[0];
    const totalPending = pending.reduce((sum, tx) => sum + Number(tx.amount), 0);

    // Vencido = tem due_date passada OU criada há mais de 30 dias sem pagamento
    const isOverdue = pending.some(tx => {
      if (tx.due_date) return tx.due_date < today;
      const diffDays = (Date.now() - new Date(tx.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return diffDays > 30;
    });

    const nextDueDate = pending
      .map(tx => tx.due_date)
      .filter(Boolean)
      .sort()[0] ?? null;

    setDebt({
      pendingAmount: totalPending,
      pendingCount:  pending.length,
      isOverdue,
      nextDueDate,
    });
  }, [playerId]);

  useEffect(() => {
    fetchDebt();
  }, [fetchDebt]);

  return { debt, refetch: fetchDebt };
};

