import React, { useMemo, useRef, useState } from "react";
import { Button, Card, Input, Modal, Slider, Space, Tag, Typography } from "antd";
import { CameraOutlined, EditOutlined, SaveOutlined } from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/axios";
import { useAvatar } from "@/hooks/useAvatar.hook";
import { PlayerAvatar } from "@/components/commons/PlayerAvatar";
import { PositionSelectorModal } from "./PositionSelectorModal";

interface Props {
  onClose: () => void;
}

const { Text, Title } = Typography;

export const ProfileModal: React.FC<Props> = ({ onClose }) => {
  const { player, updatePlayer } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState(player?.name || "");
  const [email, setEmail] = useState(player?.email || "");
  const [phone, setPhone] = useState(player?.phone || "");
  const [primaryPosition, setPrimaryPosition] = useState(player?.primary_position || "");
  const [secondaryPosition, setSecondaryPosition] = useState(player?.secondary_position || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [positionModalOpen, setPositionModalOpen] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);

  const avatar = useAvatar(player?.id || "");

  const hasChanges = useMemo(
    () =>
      name !== player?.name ||
      email !== player?.email ||
      phone !== player?.phone ||
      primaryPosition !== player?.primary_position ||
      secondaryPosition !== player?.secondary_position ||
      avatar.avatarSrc !== null ||
      newPassword.length > 0,
    [
      name,
      email,
      phone,
      primaryPosition,
      secondaryPosition,
      avatar.avatarSrc,
      newPassword,
      player,
    ],
  );

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
      <Modal
        open
        onCancel={onClose}
        width={720}
        title={<Title level={4} style={{ margin: 0 }}>Editar perfil</Title>}
        footer={[
          <Button key="cancel" onClick={onClose}>
            Cancelar
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            disabled={!hasChanges}
            onClick={handleSave}
          >
            Salvar alterações
          </Button>,
        ]}
      >
        <Space direction="vertical" size={20} style={{ width: "100%" }}>
          <Card>
            <Space direction="vertical" align="center" size={12} style={{ width: "100%" }}>
              <PlayerAvatar name={name} avatar={avatar.avatarSrc || player?.avatar} size={128} />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  avatar.selectFile(file);
                  if (file) setCropModalOpen(true);
                  event.target.value = "";
                }}
              />
              <Space>
                <Button icon={<CameraOutlined />} onClick={() => fileInputRef.current?.click()}>
                  Alterar foto
                </Button>
                {avatar.avatarSrc && (
                  <Tag color="processing">Nova foto pronta para salvar</Tag>
                )}
              </Space>
            </Space>
          </Card>

          <Card title="Dados principais">
            <Space direction="vertical" size={14} style={{ width: "100%" }}>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone" />
            </Space>
          </Card>

          <Card
            title="Posições"
            extra={
              <Button icon={<EditOutlined />} type="text" onClick={() => setPositionModalOpen(true)}>
                Editar
              </Button>
            }
          >
            <Space wrap>
              {primaryPosition ? <Tag color="green">{primaryPosition} (Principal)</Tag> : <Text type="secondary">Nenhuma posição definida</Text>}
              {secondaryPosition && <Tag>{secondaryPosition}</Tag>}
            </Space>
          </Card>

          <Card title="Segurança">
            <Space direction="vertical" size={14} style={{ width: "100%" }}>
              <Input.Password
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Senha atual"
              />
              <Input.Password
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha"
              />
              <Text type="secondary">Preencha somente se quiser alterar sua senha.</Text>
            </Space>
          </Card>
        </Space>
      </Modal>

      <Modal
        title="Ajustar recorte da imagem"
        open={cropModalOpen}
        onCancel={() => setCropModalOpen(false)}
        onOk={() => setCropModalOpen(false)}
        okText="Aplicar"
        cancelText="Cancelar"
      >
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          <div
            ref={avatar.cropBoxRef}
            onPointerDown={avatar.onPointerDown}
            onPointerMove={avatar.onPointerMove}
            onPointerUp={avatar.onPointerUp}
            className="relative mx-auto h-64 w-64 overflow-hidden rounded-full border-4 border-emerald-500 cursor-move touch-none select-none bg-slate-900"
          >
            {avatar.avatarSrc && (
              <img
                src={avatar.avatarSrc}
                alt="Preview"
                style={{
                  transform: `translate(calc(-50% + ${avatar.cropX}px), calc(-50% + ${avatar.cropY}px)) scale(${avatar.zoom})`,
                }}
                className="absolute top-1/2 left-1/2 max-w-none origin-center"
              />
            )}
          </div>
          <div>
            <Text type="secondary">Zoom</Text>
            <Slider min={1} max={3} step={0.01} value={avatar.zoom} onChange={(value) => avatar.setZoom(Number(value))} />
          </div>
        </Space>
      </Modal>

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
