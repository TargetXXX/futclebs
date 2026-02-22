import React from "react";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children, title, subtitle }) => {
  return (
    <div className="relative w-full max-w-xl mx-auto rounded-[2rem] border border-slate-700/70 bg-slate-900/75 p-6 sm:p-8 shadow-2xl shadow-black/40 backdrop-blur-2xl">
      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -right-8 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative text-center mb-7 sm:mb-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
          ⚽
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{title}</h1>
        <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-300">{subtitle}</p>
      </div>

      <div className="relative">{children}</div>
    </div>
  );
};
