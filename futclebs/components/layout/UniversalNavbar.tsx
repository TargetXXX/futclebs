import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge, Button, Drawer, Dropdown, Layout, Space, Typography } from "antd";
import {
  ClockCircleOutlined,
  HomeOutlined,
  MenuOutlined,
  LogoutOutlined,
  PlusOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { PlayerAvatar } from "../commons/PlayerAvatar";
import { ProfileModal } from "../modals/player/ProfileModal";

const { Header } = Layout;
const { Text, Title } = Typography;

export const UniversalNavbar: React.FC = () => {
  const { player, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [liveClock, setLiveClock] = React.useState(() => new Date());

  React.useEffect(() => {
    const intervalId = window.setInterval(() => setLiveClock(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const quickLinks = [
    { key: "dashboard", label: "Dashboard", icon: <HomeOutlined />, path: "/dashboard" },
    { key: "join", label: "Organizações", icon: <TeamOutlined />, path: "/join" },
  ];

  const orgIdFromPath = React.useMemo(() => {
    const match = location.pathname.match(/\/dashboard\/org\/(\d+)/);
    return match?.[1] ?? localStorage.getItem("orgId") ?? null;
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate("/login");
  };

  const isCurrentPath = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      <Header className="universal-navbar">
        <Space size={20} align="center" className="universal-navbar__left">
          <Space
            direction="vertical"
            size={0}
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/dashboard")}
            className="universal-navbar__brand"
          >
            <Title level={4} style={{ margin: 0, color: "#f8fafc" }}>
              ⚽ BOLANOPE
            </Title>
            <Text type="secondary" style={{ fontSize: 10, letterSpacing: 2 }}>
              MATCH MANAGEMENT
            </Text>
          </Space>

          <Space size={8} wrap>
            {quickLinks.map((link) => (
              <Button
                key={link.key}
                icon={link.icon}
                onClick={() => navigate(link.path)}
                className={`universal-navbar__quick-link ${isCurrentPath(link.path) ? "is-active" : ""}`}
              >
                {link.label}
              </Button>
            ))}
          </Space>
        </Space>

        <Space size={12} align="center">
          <Badge color="#22d3ee" text={<Text className="universal-navbar__clock"><ClockCircleOutlined /> {liveClock.toLocaleTimeString("pt-BR")}</Text>} />

          <Button
            className="universal-navbar__mobile-menu"
            icon={<MenuOutlined />}
            onClick={() => setMenuOpen(true)}
          />

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

      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Navegação"
        placement="right"
      >
        <Space direction="vertical" className="w-full" size={10}>
          {quickLinks.map((link) => (
            <Button
              key={`mobile-${link.key}`}
              icon={link.icon}
              onClick={() => {
                navigate(link.path);
                setMenuOpen(false);
              }}
              type={isCurrentPath(link.path) ? "primary" : "default"}
              block
            >
              {link.label}
            </Button>
          ))}

          {orgIdFromPath && (
            <Button
              icon={<TeamOutlined />}
              onClick={() => {
                navigate(`/dashboard/org/${orgIdFromPath}`);
                setMenuOpen(false);
              }}
              block
            >
              Voltar para organização
            </Button>
          )}

          <Button
            icon={<SettingOutlined />}
            onClick={() => {
              setProfileOpen(true);
              setMenuOpen(false);
            }}
            block
          >
            Editar perfil
          </Button>

          <Button danger icon={<LogoutOutlined />} onClick={handleLogout} block>
            Sair
          </Button>
        </Space>
      </Drawer>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </>
  );
};
