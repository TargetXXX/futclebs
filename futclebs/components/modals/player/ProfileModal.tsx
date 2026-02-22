import React, { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/axios";
import { useAvatar } from "@/hooks/useAvatar.hook";
import { PlayerAvatar } from "@/components/commons/PlayerAvatar";
import { PositionSelectorModal } from "./PositionSelectorModal";
import { Camera, Loader2, Pencil, Save, ShieldCheck, X } from "lucide-react";

interface Props {
  onClose: () => void;
}

export const ProfileModal: React.FC<Props> = ({ onClose }) => {
  const { player, updatePlayer } = useAuth();

  const [name, setName] = useState(player?.name || "");
  const [email, setEmail] = useState(player?.email || "");
  const [phone, setPhone] = useState(player?.phone || "");
  const [primaryPosition, setPrimaryPosition] = useState(
    player?.primary_position || ""
  );
  const [secondaryPosition, setSecondaryPosition] = useState(
    player?.secondary_position || ""
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [positionModalOpen, setPositionModalOpen] = useState(false);

  const avatar = useAvatar(player?.id || "");

  const hasChanges = useMemo(() => {
    return (
      name !== player?.name ||
      email !== player?.email ||
      phone !== player?.phone ||
      primaryPosition !== player?.primary_position ||
      secondaryPosition !== player?.secondary_position ||
      avatar.avatarSrc !== null ||
      newPassword.length > 0
    );
  }, [
    name,
    email,
    phone,
    primaryPosition,
    secondaryPosition,
    avatar.avatarSrc,
    newPassword,
    player,
  ]);
  const handleSave = async () => {
    if (!hasChanges) return;

    if (newPassword && !currentPassword) {
      alert("Digite sua senha atual");
      return;
    }

    try {
      setLoading(true);

      const payload: Record<string, string> = {};

      if (name !== player?.name) payload.name = name;
      if (email !== player?.email) payload.email = email;
      if (phone !== player?.phone) payload.phone = phone;
      if (primaryPosition !== player?.primary_position) payload.primary_position = primaryPosition;
      if (secondaryPosition !== player?.secondary_position) payload.secondary_position = secondaryPosition;

      if (avatar.avatarSrc) {
        const avatarBase64 = await avatar.getCroppedBase64();
        if (avatarBase64) payload.avatar = avatarBase64;
      }

      if (newPassword) {
        payload.password = newPassword;
        payload.current_password = currentPassword;
      }

      if (!Object.keys(payload).length) return;

      const { data } = await api.put("/players/" + player?.id, payload);

      updatePlayer(data);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
  };
  return (
  <>
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 px-4 transition-all">
      <div className="bg-slate-950 w-full max-w-xl rounded-[2.5rem] border border-white/10 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* HEADER FIXO */}
        <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-slate-950/50 backdrop-blur-sm">
          <div>
            <h2 className="text-white text-xl font-bold tracking-tight">Editar Perfil</h2>
            <p className="text-slate-500 text-xs mt-0.5">Atualize suas informações e foto</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
          
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="relative">
                {!avatar.avatarSrc ? (
                  <div className="ring-4 ring-slate-900 rounded-full">
                    <PlayerAvatar name={name} avatar={player?.avatar} size={140} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div
                      ref={avatar.cropBoxRef}
                      onPointerDown={avatar.onPointerDown}
                      onPointerMove={avatar.onPointerMove}
                      onPointerUp={avatar.onPointerUp}
                      className="relative w-44 h-44 rounded-full overflow-hidden border-4 border-emerald-500 cursor-move touch-none select-none shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    >
                      <img
                        src={avatar.avatarSrc}
                        alt="Preview"
                        style={{
                          transform: `translate(calc(-50% + ${avatar.cropX}px), calc(-50% + ${avatar.cropY}px)) scale(${avatar.zoom})`,
                        }}
                        className="absolute top-1/2 left-1/2 max-w-none origin-center"
                      />
                    </div>
                    <div className="w-full max-w-[220px] space-y-2">
                       <input
                        type="range"
                        min="1" max="3" step="0.01"
                        value={avatar.zoom}
                        onChange={(e) => avatar.setZoom(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <p className="text-center text-[11px] text-slate-500">Arraste para reposicionar e ajuste o zoom</p>
                    </div>
                  </div>
                )}

                <label className="absolute bottom-1 right-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-3 rounded-full cursor-pointer shadow-lg transition-all hover:scale-110 active:scale-95 border-4 border-slate-950">
                  <Camera size={18} strokeWidth={2.5} />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => avatar.selectFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* CAMPOS DE TEXTO */}
          <div className="grid gap-5">
            {[
              { label: "Nome", value: name, setter: setName, type: "text" },
              { label: "E-mail", value: email, setter: setEmail, type: "email" },
              { label: "Telefone", value: phone, setter: setPhone, type: "tel" },
            ].map((field) => (
              <div key={field.label} className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500 ml-1">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-3.5 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            ))}
          </div>

          {/* SEÇÃO DE POSIÇÕES */}
          <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5 text-white font-medium">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <ShieldCheck size={18} className="text-emerald-500" />
                </div>
                Suas Posições
              </div>
              <button
                onClick={() => setPositionModalOpen(true)}
                className="text-emerald-400 hover:text-emerald-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-emerald-500/5 transition-all"
              >
                <Pencil size={14} />
                Editar
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {primaryPosition ? (
                <span className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  {primaryPosition} (Principal)
                </span>
              ) : (
                <span className="text-slate-600 text-xs italic">Nenhuma posição definida</span>
              )}

              {secondaryPosition && (
                <span className="px-4 py-2 rounded-xl bg-slate-800 border border-white/5 text-slate-300 text-xs font-bold">
                  {secondaryPosition}
                </span>
              )}
            </div>
          </div>

          {/* SEÇÃO DE SENHA */}
          <div className="space-y-4 border-t border-white/5 pt-8">
            <div className="flex items-center gap-2 mb-2">
               <h3 className="text-white font-bold text-sm">Segurança</h3>
               <span className="text-[10px] text-slate-500 font-medium px-2 py-0.5 bg-slate-900 rounded-full border border-white/5">Opcional</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="password"
                placeholder="Senha Atual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-3.5 text-white focus:border-emerald-500/50 outline-none transition-all text-sm"
              />
              <input
                type="password"
                placeholder="Nova Senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-3.5 text-white focus:border-emerald-500/50 outline-none transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* FOOTER FIXO */}
        <div className="p-8 border-t border-white/5 bg-slate-950/80 backdrop-blur-md flex gap-3">
          <button
            onClick={onClose}
            className="px-6 py-4 rounded-2xl bg-slate-900 text-slate-400 font-bold text-sm hover:bg-slate-800 hover:text-white transition-all"
          >
            Cancelar
          </button>

          <button
            disabled={!hasChanges || loading}
            onClick={handleSave}
            className={`flex-1 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              hasChanges && !loading
                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/10"
                : "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
            }`}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Save size={18} />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>
    </div>

    <PositionSelectorModal
      open={positionModalOpen}
      onClose={() => setPositionModalOpen(false)}
      primaryPosition={primaryPosition}
      secondaryPosition={secondaryPosition}
      onSelect={(primary: string, secondary: string) => {
        setPrimaryPosition(primary);
        setSecondaryPosition(secondary);
      }}
    />
  </>
);
};
