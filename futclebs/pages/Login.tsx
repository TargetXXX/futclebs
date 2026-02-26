import { AuthCard } from "@/components/auth/AuthCard";
import { api } from "@/services/axios";
import { cleanPhone, formatPhone } from "@/utils/phone.utils";
import { LockOutlined, PhoneOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Layout, Space, Typography } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const { Content } = Layout;
const { Text, Title } = Typography;

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
      const response = await api.post("/auth/login", {
        ...values,
        phone: cleanPhone(values.phone),
      });
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
      <Content style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
        <div style={{ width: "100%", maxWidth: 620 }}>
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            <Space direction="vertical" size={4} style={{ textAlign: "center", width: "100%" }}>
              <Text style={{ color: "#34d399", fontWeight: 600 }}>BOLANOPE • Acesso rápido</Text>
              <Title level={4} style={{ color: "#f8fafc", margin: 0 }}>
                Entre em segundos e acompanhe sua evolução
              </Title>
            </Space>

            <AuthCard title="Bem-vindo de volta" subtitle="Acesse sua conta para continuar sua evolução nas organizações.">
              <Form<LoginValues>
                layout="vertical"
                onFinish={handleLogin}
                requiredMark={false}
                initialValues={{ phone: "", password: "" }}
              >
                <Form.Item
                  name="phone"
                  label="Telefone"
                  normalize={(value) => formatPhone(cleanPhone(value ?? ""))}
                  rules={[
                    { required: true, message: "Informe o telefone" },
                    {
                      validator: (_, value) =>
                        !value || cleanPhone(value).length === 11
                          ? Promise.resolve()
                          : Promise.reject(new Error("Informe um número com DDD (11 dígitos).")),
                    },
                  ]}
                >
                  <Input size="large" placeholder="(44) 99999-9999" prefix={<PhoneOutlined />} maxLength={15} />
                </Form.Item>

                <Form.Item name="password" label="Senha" rules={[{ required: true, message: "Informe a senha" }]}>
                  <Input.Password size="large" placeholder="••••••••" prefix={<LockOutlined />} />
                </Form.Item>

                <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                  Dica: use o mesmo telefone cadastrado na organização para localizar sua conta.
                </Text>

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
          </Space>
        </div>
      </Content>
    </Layout>
  );
}
