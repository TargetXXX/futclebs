import React from "react";

interface Props {
  avatar: any;
  userProfile: any;
  onClose: () => void;
}

export const AvatarModal: React.FC<Props> = ({
  avatar,
  userProfile,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-2xl"
      >
        <h2 className="text-white font-black text-lg mb-4">
          Alterar Avatar
        </h2>

        {/* Crop Area */}
        <div
          ref={avatar.cropBoxRef}
          className="relative w-full aspect-square rounded-2xl overflow-hidden border border-white/10 bg-slate-900"
        >
          {avatar.avatarSrc ? (
            <img
              src={avatar.avatarSrc}
              className="absolute top-1/2 left-1/2"
              style={{
                transform: `translate(calc(-50% + ${avatar.cropX}px), calc(-50% + ${avatar.cropY}px)) scale(${avatar.zoom})`,
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              Selecionar imagem
            </div>
          )}
        </div>

        {/* Zoom */}
        <div className="mt-4">
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={avatar.zoom}
            onChange={(e) => avatar.setZoom(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>

        {/* Upload */}
        <div className="mt-4 flex flex-col gap-3">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                avatar.selectFile(e.target.files?.[0] || null)
              }
            />
            <div className="w-full px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-center text-xs font-bold uppercase tracking-widest">
              Selecionar Foto
            </div>
          </label>

          <div className="flex gap-2">
            <button
              onClick={avatar.saveAvatar}
              disabled={avatar.uploading}
              className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-black font-black text-xs uppercase tracking-widest"
            >
              {avatar.uploading ? "Salvando..." : "Salvar"}
            </button>

            <button
              onClick={avatar.removeAvatar}
              disabled={avatar.uploading || !userProfile?.avatar}
              className="px-4 py-3 rounded-2xl bg-red-500/10 text-red-400 font-black text-xs uppercase tracking-widest"
            >
              Remover
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
