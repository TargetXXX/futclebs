import React from 'react';

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children, title, subtitle }) => {
  return (
    <div className="group w-full max-w-5xl mx-auto grid lg:grid-cols-[1.1fr_1fr] overflow-hidden bg-slate-900/70 backdrop-blur-2xl rounded-[2.25rem] border border-slate-700/60 shadow-[0_25px_80px_rgba(2,6,23,0.75)] transition-transform duration-300 lg:hover:-translate-y-0.5">
      <div className="hidden lg:flex flex-col justify-between p-8 border-r border-slate-800/90 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.18),transparent_50%)]">
        <div>
          <span className="inline-flex px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
            Plataforma oficial
          </span>
          <h2 className="text-3xl font-black text-white mt-6 leading-tight">Gestão profissional da sua pelada, em um só painel.</h2>
          <p className="text-slate-300/80 mt-4 text-sm leading-relaxed">
            Controle presença, acompanhe o ranking e mantenha todos os jogadores conectados com uma experiência rápida e segura.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-10">
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-3 transition-all duration-300 group-hover:border-emerald-500/30">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Módulo</p>
            <p className="text-sm font-semibold text-slate-100 mt-1">Partidas</p>
          </div>
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-3 transition-all duration-300 group-hover:border-cyan-500/30">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Módulo</p>
            <p className="text-sm font-semibold text-slate-100 mt-1">Ranking</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 md:p-10">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400/30 to-cyan-400/20 mb-4 border border-emerald-300/20 shadow-inner shadow-emerald-500/20 transition-transform duration-300 group-hover:scale-105">
            <svg className="w-8 h-8 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-5.09 3.393-9.51 7.393-12.01" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">{title}</h1>
          <p className="text-slate-300/85 text-sm sm:text-base px-2 leading-relaxed">{subtitle}</p>
        </div>
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
};
