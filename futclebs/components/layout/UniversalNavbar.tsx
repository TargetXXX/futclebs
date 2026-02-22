import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dropdown, Space, Typography } from "antd";
import { LogoutOutlined, PlusOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { PlayerAvatar } from "../commons/PlayerAvatar";
import { ProfileModal } from "../modals/player/ProfileModal";

const { Text } = Typography;

export const UniversalNavbar: React.FC = () => {
  const { player, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-cyan-900/30 bg-slate-950/85 backdrop-blur-2xl shadow-[0_8px_24px_rgba(2,6,23,0.55)]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div onClick={() => navigate("/dashboard")} className="cursor-pointer dashboard-glow rounded-2xl px-3 py-1.5 transition-all hover:bg-slate-900/60">
            <h1 className="text-lg font-black tracking-tight text-white">⚽ Futclebs Elite</h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-300/70">match management</p>
          </div>

          <Space>
            <Button icon={<PlusOutlined />} onClick={() => navigate("/join")} className="!hidden sm:!inline-flex !rounded-xl">
              Entrar em organização
            </Button>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-white">{player?.name}</p>
              <p className="text-xs text-slate-400">{player?.email || "Jogador"}</p>
            </div>

            <Dropdown
              trigger={["click"]}
              menu={{
                items: [
                  {
                    key: "profile",
                    icon: <SettingOutlined />,
                    label: "Editar perfil",
                    onClick: () => setProfileOpen(true),
                  },
                  {
                    key: "account",
                    icon: <UserOutlined />,
                    label: <Text className="!text-slate-300">{player?.name || "Minha conta"}</Text>,
                    disabled: true,
                  },
                  {
                    type: "divider",
                  },
                  {
                    key: "logout",
                    danger: true,
                    icon: <LogoutOutlined />,
                    label: "Sair",
                    onClick: handleLogout,
                  },
                ],
              }}
            >
              <div>
                <PlayerAvatar name={player?.name} avatar={player?.avatar} size={42} />
              </div>
            </Dropdown>
          </Space>
        </div>
      </nav>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </>
  );
};
