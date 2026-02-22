import React from "react";
import { Card, Space, Typography } from "antd";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const { Title, Text } = Typography;

export const AuthCard: React.FC<AuthCardProps> = ({ children, title, subtitle }) => {
  return (
    <Card
      bordered
      style={{
        width: "100%",
        maxWidth: 560,
        borderRadius: 24,
        boxShadow: "0 20px 45px rgba(2, 6, 23, 0.45)",
      }}
      styles={{
        body: {
          padding: 32,
        },
      }}
    >
      <Space direction="vertical" size={8} style={{ width: "100%", textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 36, lineHeight: 1 }}>⚽</div>
        <Title level={2} style={{ margin: 0 }}>
          {title}
        </Title>
        <Text type="secondary">{subtitle}</Text>
      </Space>

      {children}
    </Card>
  );
};
