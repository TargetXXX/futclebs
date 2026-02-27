import React from 'react';

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children, title, subtitle }) => {
  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-slate-900/75 backdrop-blur-2xl rounded-[2rem] border border-slate-700/70 shadow-[0_25px_80px_rgba(2,6,23,0.7)] transition-all duration-300">
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400/30 to-cyan-400/20 mb-4 border border-emerald-300/20 shadow-inner shadow-emerald-500/20">
          <svg className="w-8 h-8 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-5.09 3.393-9.51 7.393-12.01" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">{title}</h1>
        <p className="text-slate-300/85 text-sm sm:text-base px-2 leading-relaxed">{subtitle}</p>
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
};
