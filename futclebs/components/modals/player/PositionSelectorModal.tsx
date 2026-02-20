import React, { useState } from "react";
import { Modal, Button, message } from "antd";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/axios";

interface Props {
  open: boolean;
  onClose: () => void;
}

const positions = [
  {
    label: "GOLEIRO",
    value: "GOLEIRO",
    icon: "🧤",
    description: "Apenas para goleiros",
  },
  {
    label: "DEFESA",
    value: "DEFENSOR",
    icon: "🛡️",
  },
  {
    label: "MEIO-CAMPO",
    value: "MEIO CAMPO",
    icon: "⚡",
  },
  {
    label: "ATAQUE",
    value: "ATACANTE",
    icon: "⚽",
  },
];

export const PositionSelectorModal: React.FC<Props> = ({
  open,
  onClose,
}) => {
  const { player, updatePlayer } = useAuth();
  const [selected, setSelected] = useState<string[]>(
    [
      player?.primary_position,
      player?.secondary_position,
    ].filter(Boolean) as string[]
  );
  const [loading, setLoading] = useState(false);

  const togglePosition = (value: string) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((p) => p !== value));
      return;
    }

    if (selected.length >= 2) {
      message.warning("Você pode selecionar no máximo 2 posições.");
      return;
    }

    setSelected([...selected, value]);
  };

  const handleSave = async () => {
    if (selected.length === 0) {
      message.warning("Selecione pelo menos 1 posição.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        primary_position: selected[0] || null,
        secondary_position: selected[1] || null,
      };

      const { data } = await api.put(
        "/players/" + player?.id,
        payload
      );

      updatePlayer(data);

      message.success("Posições atualizadas!");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      footer={null}
      onCancel={onClose}
      centered
      width={480}
      bodyStyle={{ padding: 24, background: "#0f172a" }}
      closable
    >
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-white text-xl font-bold">
            Suas Posições
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {player?.name}
          </p>
          <p className="text-xs text-slate-500 uppercase mt-2 tracking-wider">
            Escolha 1 ou 2 posições • Impacta no sorteio dos times
          </p>
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {positions.map((pos) => {
            const isSelected = selected.includes(pos.value);

            return (
              <div
                key={pos.value}
                onClick={() => togglePosition(pos.value)}
                className={`cursor-pointer rounded-2xl p-4 border transition-all duration-200
                ${
                  isSelected
                    ? "bg-red-500 border-red-400"
                    : "bg-slate-800 border-slate-700 hover:border-slate-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{pos.icon}</div>
                    <div>
                      <p className="text-white font-semibold">
                        {pos.label}
                      </p>
                      {pos.description && (
                        <p className="text-xs text-slate-400">
                          {pos.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-white text-sm">
                      ✓
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Badge */}
        {selected.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
            <p className="text-xs text-slate-400 uppercase mb-2">
              Posições selecionadas
            </p>
            <div className="flex gap-2 flex-wrap">
              {selected.map((pos) => (
                <span
                  key={pos}
                  className="px-3 py-1 text-xs bg-slate-700 rounded-full text-white"
                >
                  {pos}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            type="primary"
            block
            size="large"
            loading={loading}
            disabled={selected.length === 0}
            onClick={handleSave}
            style={{
              background: "#059669",
              border: "none",
            }}
          >
            SALVAR POSIÇÕES
          </Button>

          <Button
            block
            size="large"
            onClick={onClose}
            style={{
              background: "#1e293b",
              border: "none",
              color: "#cbd5e1",
            }}
          >
            CANCELAR
          </Button>
        </div>
      </div>
    </Modal>
  );
};
