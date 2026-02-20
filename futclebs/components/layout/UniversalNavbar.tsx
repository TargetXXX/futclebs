import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ProfileModal } from "../modals/player/ProfileModal";
import { PlayerAvatar } from "../commons/PlayerAvatar";

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
    const handleClickOutside = (e: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <nav className="w-full px-6 py-4 flex items-center justify-between bg-slate-950/70 backdrop-blur-2xl border-b border-white/10 sticky top-0 z-40">
        <div
          onClick={() => navigate("/dashboard")}
          className="cursor-pointer"
        >
          <h1 className="text-white font-black text-lg tracking-tight">
            ⚽ MatchRank
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            Competitive System
          </p>
        </div>

        <div
          className="flex items-center gap-4 relative"
          ref={dropdownRef}
        >
          <div className="hidden sm:block text-right">
            <p className="text-white font-bold text-sm">
              {player?.name}
            </p>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest">
              {player?.email}
            </p>
          </div>

          <PlayerAvatar
            name={player?.name}
            avatar={player?.avatar}
            size={44}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          />

          {dropdownOpen && (
            <div className="absolute right-0 top-16 w-64 rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-2xl shadow-2xl p-3 space-y-2 animate-fadeIn">
              <button
                onClick={() => {
                  setProfileOpen(true);
                  setDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold uppercase tracking-widest transition-all"
              >
                ✏️ Editar Perfil
              </button>

              <div className="border-t border-white/10 my-2" />

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest transition-all"
              >
                🚪 Sair
              </button>
            </div>
          )}
        </div>
      </nav>

      {profileOpen && (
        <ProfileModal onClose={() => setProfileOpen(false)} />
      )}
    </>
  );
};
