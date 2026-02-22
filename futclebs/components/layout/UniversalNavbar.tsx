import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dropdown, Layout, Space, Typography } from "antd";
import { LogoutOutlined, PlusOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { PlayerAvatar } from "../commons/PlayerAvatar";
import { ProfileModal } from "../modals/player/ProfileModal";

const { Header } = Layout;
const { Text, Title } = Typography;

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
      <Header
        className="universal-navbar"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          height: 76,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(71, 85, 105, 0.55)",
          paddingInline: 24,
          background: "linear-gradient(120deg, rgba(2, 6, 23, 0.92), rgba(14, 23, 43, 0.82))",
          backdropFilter: "blur(18px)",
          boxShadow: "0 12px 38px rgba(2, 6, 23, 0.45)",
        }}
      >
        <Space direction="vertical" size={0} style={{ cursor: "pointer" }} onClick={() => navigate("/dashboard")}
          className="universal-navbar__brand"
        >
          <Title level={4} style={{ margin: 0, color: "#f8fafc" }}>
            ⚽ Futclebs Elite
          </Title>
          <Text type="secondary" style={{ fontSize: 10, letterSpacing: 2 }}>
            MATCH MANAGEMENT
          </Text>
        </Space>

        <Space size={12}>
          <Button icon={<PlusOutlined />} onClick={() => navigate("/join")}>
            Entrar em organização
          </Button>

          <Space direction="vertical" size={0} className="universal-navbar__user-meta">
            <Text strong>{player?.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {player?.email || "Jogador"}
            </Text>
          </Space>

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
                  label: player?.name || "Minha conta",
                  disabled: true,
                },
                { type: "divider" },
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
            <div className="universal-navbar__avatar" style={{ cursor: "pointer", display: "inline-flex", borderRadius: 999 }}>
              <PlayerAvatar name={player?.name} avatar={player?.avatar} size={42} />
            </div>
          </Dropdown>
        </Space>
      </Header>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </>
  );
};
