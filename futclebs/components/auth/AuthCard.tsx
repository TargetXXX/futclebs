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
      style={{
        width: "100%",
        maxWidth: 620,
        borderRadius: 24,
        boxShadow: "0 20px 45px rgba(2, 6, 23, 0.45)",
        backdropFilter: "blur(6px)",
      }}
      styles={{
        body: {
          padding: screens.md ? 32 : 20,
        },
      }}
    >
      <Space direction="vertical" size={8} style={{ width: "100%", textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: screens.md ? 36 : 30, lineHeight: 1 }}>⚽</div>
        <Title level={screens.md ? 2 : 3} style={{ margin: 0 }}>
          {title}
        </Title>
        <Text type="secondary">{subtitle}</Text>
      </Space>

      {children}
    </Card>
  );
};
