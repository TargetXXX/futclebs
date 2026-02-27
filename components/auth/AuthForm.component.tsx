import React from 'react';
import { AuthCard } from './AuthCard.tsx';
import { Input } from '../modals/shared/Input.tsx';
import { Step } from '../../types/app.types.ts';

interface AuthFormProps {
  step: Step;
  loading: boolean;
  error: string | null;
  phone: string;
  password: string;
  name: string;
  isGoalkeeper: boolean;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGoalkeeperToggle: () => void;
  onCheckPhone: (e: React.FormEvent) => void;
  onLogin: (e: React.FormEvent) => void;
  onRegister: (e: React.FormEvent) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  step,
  loading,
  error,
  phone,
  password,
  name,
  isGoalkeeper,
  onPhoneChange,
  onPasswordChange,
  onNameChange,
  onGoalkeeperToggle,
  onCheckPhone,
  onLogin,
  onRegister
}) => {
  const getTitle = () => (step === Step.REGISTER ? 'Criar Perfil' : 'FutClebs');

  const getSubtitle = () => {
    switch (step) {
      case Step.PHONE_CHECK:
        return 'Acesse sua comunidade de futebol com estatísticas, partidas e ranking em um só lugar.';
      case Step.LOGIN:
        return 'Bem-vindo de volta. Digite sua senha para continuar.';
      case Step.REGISTER:
        return 'Complete seus dados e entre no ecossistema oficial da sua pelada.';
    }
  };

  const getSubmitHandler = () => {
    switch (step) {
      case Step.PHONE_CHECK:
        return onCheckPhone;
      case Step.LOGIN:
        return onLogin;
      case Step.REGISTER:
        return onRegister;
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.20),transparent_45%),radial-gradient(circle_at_bottom,rgba(6,182,212,0.14),transparent_40%)]" />
      <div className="relative w-full">
        <AuthCard title={getTitle()} subtitle={getSubtitle()}>
          <div className="flex gap-2 mb-5">
            <span className="text-[10px] uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 rounded-full px-3 py-1 font-bold">Seguro</span>
            <span className="text-[10px] uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 rounded-full px-3 py-1 font-bold">Tempo real</span>
          </div>

          <form onSubmit={getSubmitHandler()} className="space-y-4">
            {step === Step.PHONE_CHECK && (
              <Input
                label="WhatsApp"
                value={phone}
                onChange={onPhoneChange}
                placeholder="(00) 00000-0000"
                required
              />
            )}

            {step === Step.LOGIN && (
              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={onPasswordChange}
                required
                autoFocus
              />
            )}

            {step === Step.REGISTER && (
              <div className="space-y-4">
                <Input
                  label="Nome Completo"
                  value={name}
                  onChange={onNameChange}
                  required
                  placeholder="Ex: João Silva"
                />

                <div
                  onClick={onGoalkeeperToggle}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    isGoalkeeper
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl transition-colors ${
                        isGoalkeeper ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <span className={`text-sm font-bold block ${isGoalkeeper ? 'text-emerald-500' : 'text-slate-300'}`}>
                        Eu sou Goleiro
                      </span>
                      <p className="text-[10px] text-slate-500">Marque se você joga no gol</p>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full relative transition-colors ${isGoalkeeper ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isGoalkeeper ? 'left-5' : 'left-1'}`} />
                  </div>
                </div>

                <Input
                  label="Crie uma Senha"
                  type="password"
                  value={password}
                  onChange={onPasswordChange}
                  required
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin mx-auto" />
              ) : step === Step.REGISTER ? (
                'Concluir Cadastro'
              ) : (
                'Continuar'
              )}
            </button>

            {error && (
              <p className="text-red-400 text-center text-[10px] font-black uppercase tracking-widest bg-red-500/10 py-2 rounded-lg border border-red-500/20 animate-in fade-in slide-in-from-top-1">
                {error}
              </p>
            )}
          </form>
        </AuthCard>
      </div>
    </div>
  );
};
