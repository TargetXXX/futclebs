import React from "react";
import { Card, Grid, Space, Typography } from "antd";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const { Title, Text } = Typography;

export const AuthCard: React.FC<AuthCardProps> = ({ children, title, subtitle }) => {
  const screens = Grid.useBreakpoint();

  return (
    <Card
      bordered
      className="auth-card auth-card--animated"
      style={{
        width: "100%",
        maxWidth: 720,
        borderRadius: 24,
      }}
      styles={{
        body: {
          padding: screens.md ? 36 : 22,
        },
      }}
    >
      <Space className="auth-card__header" direction="vertical" size={8} style={{ width: "100%", textAlign: "center", marginBottom: 24 }}>
        <div className="auth-card__badge">⚽</div>
        <Title level={screens.md ? 2 : 3} style={{ margin: 0 }}>
          {title}
        </Title>
        <Text type="secondary">{subtitle}</Text>
      </Space>

      {children}
    </Card>
  );
};
