import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PlayerAvatar } from "../commons/PlayerAvatar";
import { ProfileModal } from "../modals/player/ProfileModal";

export const UniversalNavbar: React.FC = () => {
  const { player, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-slate-700/60 bg-slate-950/80 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div onClick={() => navigate("/dashboard")} className="cursor-pointer">
            <h1 className="text-lg font-black tracking-tight text-white">⚽ Futclebs</h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">match management</p>
          </div>

          <div className="relative flex items-center gap-3" ref={dropdownRef}>
            <button
              onClick={() => navigate("/join")}
              className="hidden rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20 sm:block"
            >
              + Entrar em organização
            </button>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-white">{player?.name}</p>
              <p className="text-xs text-slate-400">{player?.email || "Jogador"}</p>
            </div>

            <PlayerAvatar
              name={player?.name}
              avatar={player?.avatar}
              size={42}
              onClick={() => setDropdownOpen((current) => !current)}
            />

            {dropdownOpen && (
              <div className="absolute right-0 top-14 w-64 space-y-2 rounded-2xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl">
                <button
                  onClick={() => {
                    setProfileOpen(true);
                    setDropdownOpen(false);
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-100 hover:bg-slate-700/80"
                >
                  Editar perfil
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-red-200 hover:bg-red-500/20"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </>
  );
};
