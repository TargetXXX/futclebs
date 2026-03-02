import React, { useState, useEffect, useCallback } from 'react';
import { supabase, Player, SubscriptionType, SUBSCRIPTION_LABELS, DayOfWeek, DAY_LABELS, DAY_SHORT } from '@/services/supabase';

interface FinancialConfig {
  id: string;
  day_of_week: string;
  label: string;
  monthly_both_value: number | string;
  monthly_one_value: number | string;
  daily_value: number | string;
  due_day: number | string;
  is_active: boolean;
}

interface FinancialTransaction {
  id: string;
  player_id: string;
  match_id: string | null;
  type: 'daily_fee' | 'monthly_fee' | 'extra' | 'discount';
  amount: number;
  description: string | null;
  due_date: string | null;
  reference_month: string | null;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
  players?: { name: string };
}

interface PlayerSummary {
  player_id: string;
  name: string;
  subscription_type: SubscriptionType;
  monthly_value: number;
  pending_amount: number;
  paid_amount: number;
  pending_count: number;
  is_overdue: boolean;
  next_due_date: string | null;
}

interface FinancialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  daily_fee:   '🏃 Diária',
  monthly_fee: '📅 Mensalidade',
  extra:       '➕ Extra',
  discount:    '➖ Desconto',
};

const TYPE_COLORS: Record<string, string> = {
  daily_fee:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
  monthly_fee: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  extra:       'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  discount:    'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

const SUB_COLORS: Record<SubscriptionType, string> = {
  monthly_both: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  monthly_one:  'text-blue-400 bg-blue-500/10 border-blue-500/20',
  daily:        'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  goalkeeper:   'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

const DAY_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

const AVAILABLE_DAYS: DayOfWeek[] = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

export const FinancialModal: React.FC<FinancialModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'transactions' | 'config'>('overview');
  const [players, setPlayers] = useState<Player[]>([]);
  const [summary, setSummary] = useState<PlayerSummary[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [financialConfig, setFinancialConfig] = useState<FinancialConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerTransactions, setPlayerTransactions] = useState<FinancialTransaction[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filterPaid, setFilterPaid] = useState<'all' | 'paid' | 'pending'>('all');
  const [filterType, setFilterType] = useState<'all' | 'monthly_both' | 'monthly_one' | 'daily' | 'goalkeeper'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [monthlyStats, setMonthlyStats] = useState<{
    month: string;
    totalPending: number;
    totalPaid: number;
    countPending: number;
    countPaid: number;
  } | null>(null);

  const [newTx, setNewTx] = useState({
    player_id: '',
    type: 'monthly_fee' as 'daily_fee' | 'monthly_fee' | 'extra' | 'discount',
    amount: '',
    description: '',
    paid: false,
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // '2026-03'

      const [{ data: pls }, { data: txs }, { data: smry }, { data: cfg }, { data: monthTxs }] = await Promise.all([
        supabase.from('players').select('*').order('name'),
        supabase.from('financial_transactions').select('*, players(name)').order('created_at', { ascending: false }).limit(50),
        supabase.from('financial_summary').select('*').order('name'),
        supabase.from('financial_config').select('*'),
        supabase.from('financial_transactions')
          .select('amount, paid, player_id')
          .eq('reference_month', currentMonth)
          .eq('type', 'monthly_fee'),
      ]);

      setPlayers(pls || []);
      setTransactions(txs || []);
      setSummary(smry || []);

      // Monta stats do mês atual
      const mt = monthTxs || [];
      const pendingTxs = mt.filter(t => !t.paid && Number(t.amount) > 0);
      const paidTxs    = mt.filter(t =>  t.paid && Number(t.amount) > 0);
      // Conta jogadores únicos
      const pendingPlayers = new Set(pendingTxs.map(t => t.player_id)).size;
      const paidPlayers    = new Set(paidTxs.map(t => t.player_id)).size;
      setMonthlyStats({
        month:        currentMonth,
        totalPending: pendingTxs.reduce((a, t) => a + Number(t.amount), 0),
        totalPaid:    paidTxs.reduce((a, t) => a + Number(t.amount), 0),
        countPending: pendingPlayers,
        countPaid:    paidPlayers,
      });

      // Ordena por dia da semana
      const sorted = (cfg || []).sort((a, b) => DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week));
      setFinancialConfig(sorted);
    } catch (err: any) {
      setMessage({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) { loadAll(); setMessage(null); setSelectedPlayer(null); setShowAddForm(false); }
  }, [isOpen, loadAll]);

  const loadPlayerTransactions = async (playerId: string) => {
    const { data } = await supabase.from('financial_transactions').select('*').eq('player_id', playerId).order('created_at', { ascending: false });
    setPlayerTransactions(data || []);
  };

  const handleSelectPlayer = async (player: Player) => {
    setSelectedPlayer(player);
    setNewTx(prev => ({ ...prev, player_id: player.id }));
    await loadPlayerTransactions(player.id);
  };

  const handleAddTransaction = async () => {
    if (!newTx.player_id || !newTx.amount) {
      setMessage({ type: 'error', text: '❌ Selecione o jogador e informe o valor.' });
      return;
    }
    try {
      const amount = parseFloat(newTx.amount);
      const now = new Date();
      const month = now.toISOString().slice(0, 7);
      const dueDay = financialConfig.find(c => c.is_active)?.due_day ?? 10;
      const dueDate = newTx.type === 'monthly_fee'
        ? `${month}-${String(dueDay).padStart(2, '0')}`
        : null;

      const { error } = await supabase.from('financial_transactions').insert({
        player_id:       newTx.player_id,
        type:            newTx.type,
        amount:          newTx.type === 'discount' ? -Math.abs(amount) : Math.abs(amount),
        description:     newTx.description || null,
        due_date:        dueDate,
        reference_month: newTx.type === 'monthly_fee' ? month : null,
        paid:            newTx.paid,
        paid_at:         newTx.paid ? new Date().toISOString() : null,
      });
      if (error) throw error;
      setMessage({ type: 'success', text: '✅ Lançamento adicionado!' });
      setShowAddForm(false);
      setNewTx({ player_id: selectedPlayer?.id || '', type: 'monthly_fee', amount: '', description: '', paid: false });
      await loadAll();
      if (selectedPlayer) await loadPlayerTransactions(selectedPlayer.id);
    } catch (err: any) {
      setMessage({ type: 'error', text: `❌ ${err.message}` });
    }
  };

  const handleTogglePaid = async (tx: FinancialTransaction) => {
    await supabase.from('financial_transactions').update({ paid: !tx.paid, paid_at: !tx.paid ? new Date().toISOString() : null }).eq('id', tx.id);
    await loadAll();
    if (selectedPlayer) await loadPlayerTransactions(selectedPlayer.id);
  };

  const handleDeleteTx = async (id: string) => {
    if (!confirm('Remover este lançamento?')) return;
    await supabase.from('financial_transactions').delete().eq('id', id);
    await loadAll();
    if (selectedPlayer) await loadPlayerTransactions(selectedPlayer.id);
  };

  const handleUpdateSubscription = async (player: Player, type: SubscriptionType) => {
    await supabase.from('players').update({ subscription_type: type }).eq('id', player.id);
    setSelectedPlayer(prev => prev ? { ...prev, subscription_type: type } : prev);
    await loadAll();
  };

  const handleUpdateMatchDays = async (player: Player, day: DayOfWeek) => {
    const current: DayOfWeek[] = player.match_days || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
    await supabase.from('players').update({ match_days: updated }).eq('id', player.id);
    setSelectedPlayer(prev => prev ? { ...prev, match_days: updated } : prev);
    await loadAll();
  };

  const handleCopyCoop = async () => {
    const month = new Date().toISOString().slice(0, 7);
    const monthLabel = new Date(month + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    const mensalistas = summary.filter(s =>
      s.subscription_type !== 'daily' && s.subscription_type !== 'goalkeeper'
    ).sort((a, b) => a.name.localeCompare(b.name));

    const pagos    = mensalistas.filter(s => Number(s.pending_amount) === 0);
    const devendo  = mensalistas.filter(s => Number(s.pending_amount) >  0);

    const lines: string[] = [];
    lines.push(`💰 *CAIXA FutClebs* — ${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}`);
    lines.push('');

    if (pagos.length > 0) {
      lines.push(`✅ *PAGOS (${pagos.length}):*`);
      pagos.forEach((s, i) => {
        lines.push(`${i + 1}. ${s.name} — ${formatCurrency(Number(s.paid_amount))}`);
      });
    }

    lines.push('');

    if (devendo.length > 0) {
      lines.push(`⏳ *PENDENTES (${devendo.length}):*`);
      devendo.forEach((s, i) => {
        const vencido = s.is_overdue ? ' ⚠️' : '';
        lines.push(`${i + 1}. ${s.name} — ${formatCurrency(Number(s.pending_amount))}${vencido}`);
      });
    }

    lines.push('');
    lines.push(`📊 *Total recebido: ${formatCurrency(pagos.reduce((a, s) => a + Number(s.paid_amount), 0))}*`);
    lines.push(`📊 *Total pendente: ${formatCurrency(devendo.reduce((a, s) => a + Number(s.pending_amount), 0))}*`);
    lines.push('');
    lines.push(`_Gerado pelo FutClebs_ 🤖`);

    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ type: 'success', text: '📋 Coop copiado! Cole no WhatsApp.' });
    } catch {
      setMessage({ type: 'error', text: 'Erro ao copiar. Tente manualmente.' });
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    setMessage(null);
    try {
      for (const cfg of financialConfig) {
        const { error } = await supabase.from('financial_config').update({
          monthly_both_value: toNum(cfg.monthly_both_value),
          monthly_one_value:  toNum(cfg.monthly_one_value),
          daily_value:        toNum(cfg.daily_value),
          due_day:            Number(cfg.due_day) || 10,
          is_active:          cfg.is_active,
          updated_at:         new Date().toISOString(),
        }).eq('id', cfg.id);
        if (error) throw error;
      }
      setMessage({ type: 'success', text: '✅ Valores salvos com sucesso!' });
      await loadAll();
    } catch (err: any) {
      setMessage({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setSavingConfig(false);
    }
  };

  const updateConfig = (id: string, field: keyof FinancialConfig, value: any) => {
    setFinancialConfig(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const toNum = (v: number | string) => {
    const n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? 0 : n;
  };

  const handleGenerateMonthly = async () => {
    if (!confirm('Gerar cobranças mensais para todos os jogadores mensalistas do mês atual?')) return;
    const now = new Date();
    const month = now.toISOString().slice(0, 7); // '2026-03'
    const dueDay = financialConfig.find(c => c.is_active)?.due_day ?? 10;
    const dueDate = `${month}-${String(dueDay).padStart(2, '0')}`; // '2026-03-10'

    const activeDays = financialConfig.filter(c => c.is_active);
    let count = 0;
    for (const p of players.filter(pl => pl.subscription_type !== 'daily' && pl.subscription_type !== 'goalkeeper')) {
      const amount = activeDays.reduce((sum, day) => {
        return sum + (p.subscription_type === 'monthly_both' ? toNum(day.monthly_both_value) : toNum(day.monthly_one_value));
      }, 0);
      if (amount <= 0) continue;
      const { error } = await supabase.from('financial_transactions').insert({
        player_id:       p.id,
        type:            'monthly_fee',
        amount,
        description:     `Mensalidade ${month}`,
        due_date:        dueDate,
        reference_month: month,
        paid:            false,
      });
      if (!error) count++;
    }
    setMessage({ type: 'success', text: `✅ ${count} cobranças geradas para ${month} · vencimento ${new Date(dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}` });
    await loadAll();
  };

  const formatCurrency = (v: number) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

  const filteredSummary = summary.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPaid   = filterPaid === 'all' ? true : filterPaid === 'pending' ? s.pending_amount > 0 : s.pending_amount === 0;
    const matchType   = filterType === 'all' ? true : s.subscription_type === filterType;
    return matchSearch && matchPaid && matchType;
  });

  const totalPending    = summary.reduce((a, s) => a + Number(s.pending_amount), 0);
  const totalPaid       = summary.reduce((a, s) => a + Number(s.paid_amount), 0);
  const playersWithDebt = summary.filter(s => s.pending_amount > 0).length;

  // Totalizadores por tipo de mensalidade
  const countByType = (type: SubscriptionType) => players.filter(p => (p.subscription_type || 'monthly_both') === type).length;
  const pendingByType = (type: SubscriptionType) => summary.filter(s => s.subscription_type === type).reduce((a, s) => a + Number(s.pending_amount), 0);
  const paidByType   = (type: SubscriptionType) => summary.filter(s => s.subscription_type === type).reduce((a, s) => a + Number(s.paid_amount), 0);

  // Calcula total mensal dinamicamente pela config
  const totalMonthlyCost = (type: SubscriptionType) =>
    financialConfig.filter(c => c.is_active).reduce((sum, c) => {
      if (type === 'monthly_both') return sum + toNum(c.monthly_both_value);
      if (type === 'monthly_one')  return sum + toNum(c.monthly_one_value);
      return sum;
    }, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full h-full sm:h-auto sm:max-w-2xl bg-slate-950 sm:bg-slate-900 border-none sm:border sm:border-slate-800 sm:rounded-[2.5rem] overflow-hidden flex flex-col max-h-screen sm:max-h-[90vh] shadow-2xl">

        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">💰 Financeiro</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Controle de Mensalidades</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-2xl transition-colors text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 shrink-0">
          {(['overview', 'players', 'transactions', 'config'] as const).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setSelectedPlayer(null); setShowAddForm(false); setMessage(null); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-white border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}>
              {tab === 'overview' ? '📊' : tab === 'players' ? '👥' : tab === 'transactions' ? '📋' : '⚙️'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16">
              <div className="w-6 h-6 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-slate-500 text-xs font-black uppercase">Carregando...</p>
            </div>

          ) : activeTab === 'config' ? (
            /* ─── ABA CONFIGURAÇÃO DE VALORES ─── */
            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <p className="text-white font-black text-sm">Valores por Dia</p>
                <p className="text-slate-500 text-xs">Configure o valor cobrado em cada dia da semana por tipo de mensalidade.</p>
              </div>

              <div className="space-y-3">
                {financialConfig.map(cfg => (
                  <div key={cfg.id} className={`p-4 rounded-2xl border space-y-3 transition-all ${cfg.is_active ? 'bg-slate-800/30 border-slate-700/30' : 'bg-slate-900/30 border-slate-800/30 opacity-60'}`}>
                    {/* Cabeçalho do dia */}
                    <div className="flex items-center justify-between">
                      <p className="text-white font-black text-sm">{cfg.label}</p>
                      <button onClick={() => updateConfig(cfg.id, 'is_active', !cfg.is_active)}
                        className={`relative w-10 h-5 rounded-full transition-all ${cfg.is_active ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${cfg.is_active ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>

                    {cfg.is_active && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                        {/* Mensal 2x */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Mensal 2x</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">R$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={cfg.monthly_both_value}
                              onChange={e => updateConfig(cfg.id, 'monthly_both_value', e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700/50 rounded-xl pl-7 pr-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                          </div>
                        </div>

                        {/* Mensal 1x */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-blue-400">Mensal 1x</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">R$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={cfg.monthly_one_value}
                              onChange={e => updateConfig(cfg.id, 'monthly_one_value', e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700/50 rounded-xl pl-7 pr-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                          </div>
                        </div>

                        {/* Diária */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-yellow-400">Diária</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">R$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={cfg.daily_value}
                              onChange={e => updateConfig(cfg.id, 'daily_value', e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700/50 rounded-xl pl-7 pr-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Dia de vencimento */}
                      <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">📅 Vencimento — dia</span>
                        <input
                          type="number"
                          min="1"
                          max="28"
                          value={cfg.due_day}
                          onChange={e => updateConfig(cfg.id, 'due_day', e.target.value)}
                          className="w-16 bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-1.5 text-sm text-white text-center font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                        <span className="text-slate-500 text-xs">de cada mês</span>
                      </div>
                    </div>
                    )}
                  </div>
                ))}

                {/* Totais calculados */}
                <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Totais Mensais (dias ativos)</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase text-emerald-400">Mensal 2x</p>
                      <p className="text-white font-black text-sm">{formatCurrency(totalMonthlyCost('monthly_both'))}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase text-blue-400">Mensal 1x</p>
                      <p className="text-white font-black text-sm">{formatCurrency(totalMonthlyCost('monthly_one'))}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase text-yellow-400">Diária</p>
                      <p className="text-slate-500 font-black text-sm text-xs">por jogo</p>
                    </div>
                  </div>
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-2xl text-xs font-bold border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                  {message.text}
                </div>
              )}

              <button onClick={handleSaveConfig} disabled={savingConfig}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
                {savingConfig ? <><div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />Salvando...</> : '💾 Salvar Valores'}
              </button>
            </div>

          ) : activeTab === 'overview' ? (
            /* ─── ABA RESUMO ─── */
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
                  <p className="text-red-400 text-[10px] font-black uppercase tracking-wider mb-1">A Receber</p>
                  <p className="text-white text-lg font-black">{formatCurrency(totalPending)}</p>
                  <p className="text-red-400/70 text-[10px] mt-1">{playersWithDebt} devendo</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                  <p className="text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-1">Recebido</p>
                  <p className="text-white text-lg font-black">{formatCurrency(totalPaid)}</p>
                  <p className="text-emerald-400/70 text-[10px] mt-1">total pago</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/30 rounded-2xl p-4 text-center">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Jogadores</p>
                  <p className="text-white text-lg font-black">{players.length}</p>
                  <p className="text-slate-500 text-[10px] mt-1">cadastrados</p>
                </div>
              </div>

              {/* Totalizadores por grupo */}
              <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Por Grupo</p>

                {/* Mensal 2x */}
                <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">Mensal 2x</span>
                    <span className="text-slate-500 text-[10px] font-bold">{countByType('monthly_both')} jogadores</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-black text-sm">{formatCurrency(totalMonthlyCost('monthly_both'))}<span className="text-slate-600 font-bold text-[10px]">/mês</span></p>
                    <div className="flex gap-2 justify-end mt-0.5">
                      {pendingByType('monthly_both') > 0 && <span className="text-red-400 text-[9px] font-black">↑ {formatCurrency(pendingByType('monthly_both'))} pend.</span>}
                      {paidByType('monthly_both') > 0 && <span className="text-emerald-400 text-[9px] font-black">✓ {formatCurrency(paidByType('monthly_both'))}</span>}
                    </div>
                  </div>
                </div>

                {/* Mensal 1x */}
                <div className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400">Mensal 1x</span>
                    <span className="text-slate-500 text-[10px] font-bold">{countByType('monthly_one')} jogadores</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-black text-sm">{formatCurrency(totalMonthlyCost('monthly_one'))}<span className="text-slate-600 font-bold text-[10px]">/mês</span></p>
                    <div className="flex gap-2 justify-end mt-0.5">
                      {pendingByType('monthly_one') > 0 && <span className="text-red-400 text-[9px] font-black">↑ {formatCurrency(pendingByType('monthly_one'))} pend.</span>}
                      {paidByType('monthly_one') > 0 && <span className="text-emerald-400 text-[9px] font-black">✓ {formatCurrency(paidByType('monthly_one'))}</span>}
                    </div>
                  </div>
                </div>

                {/* Diária */}
                <div className="flex items-center justify-between p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400">Diária</span>
                    <span className="text-slate-500 text-[10px] font-bold">{countByType('daily')} jogadores</span>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 font-black text-sm text-[10px]">por jogo</p>
                    <div className="flex gap-2 justify-end mt-0.5">
                      {pendingByType('daily') > 0 && <span className="text-red-400 text-[9px] font-black">↑ {formatCurrency(pendingByType('daily'))} pend.</span>}
                      {paidByType('daily') > 0 && <span className="text-emerald-400 text-[9px] font-black">✓ {formatCurrency(paidByType('daily'))}</span>}
                    </div>
                  </div>
                </div>

                {/* Goleiro */}
                <div className="flex items-center justify-between p-3 bg-slate-700/20 border border-slate-600/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-600/30 border border-slate-600/40 text-slate-400">🧤 Goleiro</span>
                    <span className="text-slate-500 text-[10px] font-bold">{countByType('goalkeeper')} jogadores</span>
                  </div>
                  <p className="text-slate-600 font-black text-sm">Isento</p>
                </div>

                {/* Total esperado por mês */}
                <div className="border-t border-slate-700/40 pt-3 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total esperado/mês</p>
                  <p className="text-white font-black text-base">
                    {formatCurrency(
                      countByType('monthly_both') * totalMonthlyCost('monthly_both') +
                      countByType('monthly_one')  * totalMonthlyCost('monthly_one')
                    )}
                  </p>
                </div>
              </div>

              {/* Tabela de valores dinâmica */}
              <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tabela de Valores</p>
                  <button onClick={() => setActiveTab('config')} className="text-[9px] font-black uppercase text-emerald-400 hover:text-emerald-300">
                    ✏️ Editar
                  </button>
                </div>
                <div className="space-y-2">
                  {financialConfig.filter(c => c.is_active).map(c => (
                    <div key={c.id} className="grid grid-cols-4 gap-2 text-[10px] items-center">
                      <span className="text-slate-400 font-bold">{c.label.replace('-feira', '')}</span>
                      <span className="text-emerald-400 font-black text-center">{formatCurrency(toNum(c.monthly_both_value))} <span className="text-slate-600">2x</span></span>
                      <span className="text-blue-400 font-black text-center">{formatCurrency(toNum(c.monthly_one_value))} <span className="text-slate-600">1x</span></span>
                      <span className="text-yellow-400 font-black text-center">{formatCurrency(toNum(c.daily_value))} <span className="text-slate-600">diária</span></span>
                    </div>
                  ))}
                  <div className="border-t border-slate-700/50 pt-2 grid grid-cols-4 gap-2 text-[10px]">
                    <span className="text-slate-500 font-black uppercase">Total/mês</span>
                    <span className="text-emerald-400 font-black text-center">{formatCurrency(totalMonthlyCost('monthly_both'))}</span>
                    <span className="text-blue-400 font-black text-center">{formatCurrency(totalMonthlyCost('monthly_one'))}</span>
                    <span className="text-yellow-400/60 font-black text-center text-[9px]">por jogo</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleGenerateMonthly}
                  className="py-3 rounded-2xl bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-600/20 text-emerald-400 font-black text-xs uppercase tracking-widest transition-all">
                  ⚡ Gerar Cobranças
                </button>
                <button onClick={handleCopyCoop}
                  className="py-3 rounded-2xl bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600/20 text-blue-400 font-black text-xs uppercase tracking-widest transition-all">
                  📋 Copiar Coop
                </button>
              </div>

              {summary.filter(s => s.pending_amount > 0).length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pendências</p>
                  {summary.filter(s => s.pending_amount > 0).slice(0, 5).map(s => (
                    <div key={s.player_id} className={`flex items-center justify-between p-3 border rounded-xl ${s.is_overdue ? 'bg-red-500/10 border-red-500/30' : 'bg-red-500/5 border-red-500/20'}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold text-sm">{s.name}</p>
                          {s.is_overdue && <span className="text-[9px] font-black uppercase bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">⚠️ Vencido</span>}
                        </div>
                        <p className="text-slate-500 text-[10px]">
                          {SUBSCRIPTION_LABELS[s.subscription_type]} · {s.pending_count} lançamento(s)
                          {s.next_due_date && !s.is_overdue && ` · vence ${new Date(s.next_due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`}
                        </p>
                      </div>
                      <p className="text-red-400 font-black text-sm">{formatCurrency(Number(s.pending_amount))}</p>
                    </div>
                  ))}
                </div>
              )}

              {message && (
                <div className={`p-4 rounded-2xl text-xs font-bold border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                  {message.text}
                </div>
              )}
            </div>

          ) : activeTab === 'players' ? (
            /* ─── ABA JOGADORES ─── */
            <div className="p-6 space-y-4">
              {selectedPlayer ? (
                <div className="space-y-4">
                  <button onClick={() => { setSelectedPlayer(null); setShowAddForm(false); }}
                    className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all">
                    ← Voltar
                  </button>

                  <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-black text-lg">{selectedPlayer.name}</p>
                        <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full border mt-1 ${SUB_COLORS[selectedPlayer.subscription_type || 'monthly_both']}`}>
                          {SUBSCRIPTION_LABELS[selectedPlayer.subscription_type || 'monthly_both']}
                        </span>
                      </div>
                      <div className="text-right">
                        {(() => {
                          const s = summary.find(x => x.player_id === selectedPlayer.id);
                          return s ? (
                            <>
                              <p className="text-red-400 font-black text-sm">{formatCurrency(Number(s.pending_amount))}</p>
                              <p className="text-slate-500 text-[10px]">pendente</p>
                            </>
                          ) : null;
                        })()}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo de Mensalidade</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['monthly_both', 'monthly_one', 'daily', 'goalkeeper'] as SubscriptionType[]).map(type => (
                          <button key={type} onClick={() => handleUpdateSubscription(selectedPlayer, type)}
                            className={`py-2 px-2 rounded-xl font-black text-[10px] uppercase border transition-all text-center ${(selectedPlayer.subscription_type || 'monthly_both') === type ? SUB_COLORS[type] : 'bg-slate-800/50 border-slate-700/50 text-slate-500 hover:text-slate-300'}`}>
                            {type === 'monthly_both'
                              ? `Seg+Qui · ${formatCurrency(totalMonthlyCost('monthly_both'))}`
                              : type === 'monthly_one'
                              ? `1 Jogo · ${formatCurrency(totalMonthlyCost('monthly_one'))}`
                              : type === 'daily'
                              ? 'Diária · R$?/jogo'
                              : '🧤 Goleiro · Isento'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dias de jogo */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">📅 Dias de Jogo</p>
                      <div className="grid grid-cols-7 gap-1">
                        {AVAILABLE_DAYS.map(day => {
                          const active = (selectedPlayer.match_days || []).includes(day);
                          return (
                            <button
                              key={day}
                              onClick={() => handleUpdateMatchDays(selectedPlayer, day)}
                              className={`py-1.5 rounded-xl font-black text-[9px] uppercase border transition-all text-center ${active ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-slate-800/50 border-slate-700/50 text-slate-600 hover:text-slate-400'}`}
                              title={DAY_LABELS[day]}
                            >
                              {DAY_SHORT[day]}
                            </button>
                          );
                        })}
                      </div>
                      {(selectedPlayer.match_days || []).length === 0 && (
                        <p className="text-[9px] text-slate-600 font-bold">Nenhum dia selecionado</p>
                      )}
                      {(selectedPlayer.match_days || []).length > 0 && (
                        <p className="text-[9px] text-emerald-400/70 font-bold">
                          {(selectedPlayer.match_days || []).map(d => DAY_LABELS[d]).join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {!showAddForm ? (
                    <button onClick={() => setShowAddForm(true)}
                      className="w-full py-3 rounded-2xl border border-dashed border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/5 font-black text-[10px] uppercase tracking-widest transition-all">
                      + Novo Lançamento
                    </button>
                  ) : (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Novo Lançamento</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(['monthly_fee', 'daily_fee', 'extra', 'discount'] as const).map(t => (
                          <button key={t} onClick={() => setNewTx(prev => ({ ...prev, type: t }))}
                            className={`py-2 rounded-xl font-black text-[10px] uppercase border transition-all ${newTx.type === t ? TYPE_COLORS[t] : 'bg-slate-800/50 border-slate-700/50 text-slate-500'}`}>
                            {TYPE_LABELS[t]}
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">R$</span>
                        <input type="number" placeholder="0,00" value={newTx.amount}
                          onChange={e => setNewTx(prev => ({ ...prev, amount: e.target.value }))}
                          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-600" />
                      </div>
                      <input type="text" placeholder="Descrição (opcional)" value={newTx.description}
                        onChange={e => setNewTx(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-600" />
                      <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl">
                        <button onClick={() => setNewTx(prev => ({ ...prev, paid: !prev.paid }))}
                          className={`relative w-10 h-5 rounded-full transition-all ${newTx.paid ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${newTx.paid ? 'left-5' : 'left-0.5'}`} />
                        </button>
                        <span className="text-slate-400 text-xs font-bold">{newTx.paid ? 'Já pago' : 'Pendente'}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleAddTransaction} className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-widest transition-all">💾 Salvar</button>
                        <button onClick={() => setShowAddForm(false)} className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-black text-[10px] uppercase transition-all">Cancelar</button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Histórico</p>
                    {playerTransactions.length === 0 ? (
                      <p className="text-slate-600 text-xs text-center py-6">Nenhum lançamento ainda</p>
                    ) : (
                      playerTransactions.map(tx => (
                        <div key={tx.id} className={`flex items-center justify-between p-3 rounded-xl border ${tx.paid ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full border ${TYPE_COLORS[tx.type]}`}>{TYPE_LABELS[tx.type]}</span>
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${tx.paid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{tx.paid ? '✅ Pago' : '⏳ Pendente'}</span>
                            </div>
                            <p className="text-slate-400 text-[10px] mt-1 truncate">{tx.description || TYPE_LABELS[tx.type]}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-slate-600 text-[9px]">{formatDate(tx.created_at)}</p>
                              {tx.due_date && !tx.paid && (
                                <p className={`text-[9px] font-black ${new Date(tx.due_date) < new Date() ? 'text-red-500' : 'text-slate-500'}`}>
                                  {new Date(tx.due_date) < new Date() ? '⚠️ Venceu' : '📅 Vence'} {new Date(tx.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <p className={`font-black text-sm ${tx.amount < 0 ? 'text-orange-400' : tx.paid ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(Math.abs(tx.amount))}</p>
                            <button onClick={() => handleTogglePaid(tx)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-all" title="Marcar pago/pendente">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                            <button onClick={() => handleDeleteTx(tx.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {message && (
                    <div className={`p-4 rounded-2xl text-xs font-bold border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                      {message.text}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">

                  {/* ── Overview do mês atual ── */}
                  {monthlyStats && (
                    <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          📅 {new Date(monthlyStats.month + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </p>
                        <span className="text-[9px] font-black uppercase text-slate-600">mês atual</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Pendentes */}
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                          <p className="text-red-400 text-[9px] font-black uppercase tracking-wider mb-1">⏳ Pendentes</p>
                          <p className="text-white font-black text-base leading-none">{formatCurrency(monthlyStats.totalPending)}</p>
                          <p className="text-red-400/70 text-[10px] mt-1 font-bold">{monthlyStats.countPending} jogador{monthlyStats.countPending !== 1 ? 'es' : ''}</p>
                        </div>
                        {/* Pagos */}
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                          <p className="text-emerald-400 text-[9px] font-black uppercase tracking-wider mb-1">✅ Pagos</p>
                          <p className="text-white font-black text-base leading-none">{formatCurrency(monthlyStats.totalPaid)}</p>
                          <p className="text-emerald-400/70 text-[10px] mt-1 font-bold">{monthlyStats.countPaid} jogador{monthlyStats.countPaid !== 1 ? 'es' : ''}</p>
                        </div>
                      </div>
                      {/* Barra de progresso */}
                      {(monthlyStats.totalPending + monthlyStats.totalPaid) > 0 && (() => {
                        const total = monthlyStats.totalPending + monthlyStats.totalPaid;
                        const pct   = Math.round((monthlyStats.totalPaid / total) * 100);
                        return (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                              <span>progresso de pagamento</span>
                              <span className={pct === 100 ? 'text-emerald-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400'}>{pct}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <input type="text" placeholder="Buscar jogador..." value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-600" />
                  <div className="flex gap-1.5">
                    {(['all', 'pending', 'paid'] as const).map(f => (
                      <button key={f} onClick={() => setFilterPaid(f)}
                        className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase border transition-all ${filterPaid === f ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-slate-800/50 border-slate-700/50 text-slate-500'}`}>
                        {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : 'Pagos'}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {([
                      { key: 'all',          label: 'Todos',    color: 'bg-slate-800/50 border-slate-700/50 text-slate-400' },
                      { key: 'monthly_both', label: 'Mensal 2x', color: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' },
                      { key: 'monthly_one',  label: 'Mensal 1x', color: 'bg-blue-500/20 border-blue-500/30 text-blue-400' },
                      { key: 'daily',        label: 'Diário',   color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' },
                      { key: 'goalkeeper',   label: '🧤 Goleiro', color: 'bg-slate-700/30 border-slate-600/40 text-slate-400' },
                    ] as const).map(f => (
                      <button key={f.key} onClick={() => setFilterType(f.key)}
                        className={`px-2.5 py-1.5 rounded-xl font-black text-[9px] uppercase border transition-all ${filterType === f.key ? f.color : 'bg-slate-800/30 border-slate-700/30 text-slate-600 hover:text-slate-400'}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  {filteredSummary.map(s => {
                    const player = players.find(p => p.id === s.player_id);
                    if (!player) return null;
                    return (
                      <button key={s.player_id} onClick={() => handleSelectPlayer(player)}
                        className="w-full p-4 bg-slate-800/30 border border-slate-700/30 hover:border-emerald-500/30 rounded-2xl transition-all text-left space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-white font-black text-sm truncate">{s.name}</p>
                            <span className={`inline-block text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full border mt-1 ${SUB_COLORS[s.subscription_type]}`}>
                              {SUBSCRIPTION_LABELS[s.subscription_type]}
                            </span>
                            {/* Dias de jogo */}
                            {(player.match_days || []).length > 0 && (
                              <div className="flex gap-1 mt-1.5 flex-wrap">
                                {(player.match_days || []).map(d => (
                                  <span key={d} className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-lg bg-slate-700/60 text-slate-400 border border-slate-600/40">
                                    {DAY_SHORT[d]}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            {s.subscription_type === 'goalkeeper' ? (
                              <p className="text-slate-400 font-black text-sm">🧤 Isento</p>
                            ) : Number(s.pending_amount) > 0 ? (
                              <>
                                <p className="text-red-400 font-black text-sm">{formatCurrency(Number(s.pending_amount))}</p>
                                {s.is_overdue && <p className="text-red-500 text-[9px] font-black uppercase">⚠️ Vencido</p>}
                                {!s.is_overdue && s.next_due_date && (
                                  <p className="text-slate-500 text-[9px]">vence {new Date(s.next_due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                                )}
                              </>
                            ) : (
                              <p className="text-emerald-400 font-black text-sm">✅ Em dia</p>
                            )}
                            {s.subscription_type !== 'goalkeeper' && (
                              <p className="text-slate-600 text-[9px]">pago: {formatCurrency(Number(s.paid_amount))}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          ) : (
            /* ─── ABA LANÇAMENTOS ─── */
            <div className="p-6 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Últimos 50 lançamentos</p>
              {transactions.length === 0 ? (
                <p className="text-slate-600 text-xs text-center py-10">Nenhum lançamento ainda</p>
              ) : (
                transactions.map(tx => (
                  <div key={tx.id} className={`flex items-center justify-between p-3 rounded-xl border ${tx.paid ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-bold text-sm truncate">{tx.players?.name || '—'}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full border ${TYPE_COLORS[tx.type]}`}>{TYPE_LABELS[tx.type]}</span>
                        <span className="text-slate-600 text-[9px]">{formatDate(tx.created_at)}</span>
                      </div>
                      {tx.description && <p className="text-slate-500 text-[10px] mt-0.5 truncate">{tx.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <div className="text-right">
                        <p className={`font-black text-sm ${tx.paid ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(Math.abs(tx.amount))}</p>
                        <p className={`text-[9px] font-black ${tx.paid ? 'text-emerald-400/60' : 'text-red-400/60'}`}>{tx.paid ? 'Pago' : 'Pendente'}</p>
                      </div>
                      <button onClick={() => handleTogglePaid(tx)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 shrink-0">
          <button onClick={onClose} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl transition-all">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
