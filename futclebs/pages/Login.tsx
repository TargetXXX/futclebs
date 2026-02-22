import { AuthCard } from "@/components/auth/AuthCard";
import { api } from "@/services/axios";
import { Alert, Button, Form, Input, Layout, Space, Typography } from "antd";
import { LockOutlined, PhoneOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const { Content } = Layout;
const { Text } = Typography;

interface LoginValues {
  phone: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (values: LoginValues) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/auth/login", values);
      const { token, player } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(player));
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "linear-gradient(135deg, #020617 0%, #0f172a 45%, #082f49 100%)" }}>
      <Content style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <AuthCard title="Bem-vindo de volta" subtitle="Acesse sua conta para continuar sua evolução nas organizações.">
          <Form<LoginValues> layout="vertical" onFinish={handleLogin} requiredMark={false}>
            <Form.Item name="phone" label="Telefone" rules={[{ required: true, message: "Informe o telefone" }]}>
              <Input size="large" placeholder="44999999999" prefix={<PhoneOutlined />} />
            </Form.Item>

            <Form.Item name="password" label="Senha" rules={[{ required: true, message: "Informe a senha" }]}>
              <Input.Password size="large" placeholder="••••••••" prefix={<LockOutlined />} />
            </Form.Item>

            {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              Entrar
            </Button>
          </Form>

          <Space direction="vertical" style={{ marginTop: 20, width: "100%", textAlign: "center" }}>
            <Text type="secondary">
              Não tem conta?{" "}
              <Button type="link" onClick={() => navigate("/register")} style={{ paddingInline: 0 }}>
                Criar conta
              </Button>
            </Text>
          </Space>
        </AuthCard>
      </Content>
    </Layout>
  );
}
